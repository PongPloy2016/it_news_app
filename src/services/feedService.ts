import { FEED_GROUPS, FeedGroup } from '../config/categories';
import { MAX_CONCURRENT_FEEDS } from '../config/constants';
import { FeedSource } from '../config/feeds';
import { fetchAndParseFeed } from '../data/rss';
import { dedupeAndSortArticles } from '../data/rss/dedupe';
import { NewsArticle } from '../types';

type QueueTask = {
  feed: FeedSource;
  priority: number;
  resolve: (articles: NewsArticle[]) => void;
  reject: (error: unknown) => void;
};

class FeedServiceQueue {
  private queue: QueueTask[] = [];
  private activeCount: number = 0;
  private concurrency: number = MAX_CONCURRENT_FEEDS;
  private cache: Map<string, { articles: NewsArticle[]; timestamp: number }> = new Map();
  private feedGroups: FeedGroup[] = FEED_GROUPS;

  constructor(concurrency: number = MAX_CONCURRENT_FEEDS) {
    this.concurrency = concurrency;
  }

  setFeedGroups(groups: FeedGroup[]): void {
    if (groups && groups.length > 0) {
      this.feedGroups = groups;
    }
  }

  getFeedGroups(): FeedGroup[] {
    return this.feedGroups;
  }

  /**
   * Fetch feed with priority and queue control
   */
  async fetchFeed(feed: FeedSource, priority: number = 0): Promise<NewsArticle[]> {
    // Aggregate feeds combine multiple child feeds in the group
    if (feed.type === 'aggregate') {
      return this.fetchAggregateFeed(feed, priority);
    }

    // HTML web feeds create a single synthetic article for WebView
    if (feed.type === 'html') {
      return [
        {
          id: `html:${feed.key}`,
          title: feed.label,
          link: feed.url,
          description: `เว็บไซต์ ${feed.label}`,
          content: feed.url,
          readingTime: 1,
          publishedMillis: Date.now(),
        },
      ];
    }

    // Check memory cache within 5 minutes
    const cached = this.cache.get(feed.key);
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.articles;
    }

    return new Promise<NewsArticle[]>((resolve, reject) => {
      // Insert with priority (lower number = higher priority)
      const task: QueueTask = { feed, priority, resolve, reject };
      const insertIndex = this.queue.findIndex((item) => item.priority > priority);
      if (insertIndex === -1) {
        this.queue.push(task);
      } else {
        this.queue.splice(insertIndex, 0, task);
      }

      this.processNext();
    });
  }

  /**
   * Fetch aggregate feed: combines articles from all child feeds in a category,
   * tags each article with publisher info, deduplicates, and sorts by newest first.
   */
  async fetchAggregateFeed(
    aggregateFeed: FeedSource,
    priority: number = 0,
  ): Promise<NewsArticle[]> {
    // Check memory cache within 3 minutes
    const cached = this.cache.get(aggregateFeed.key);
    if (cached && Date.now() - cached.timestamp < 3 * 60 * 1000) {
      return cached.articles;
    }

    const group = this.feedGroups.find((g) => g.sources.some((s) => s.key === aggregateFeed.key));
    const childSources = (group?.sources ?? []).filter(
      (s) => s.type !== 'aggregate' && s.type !== 'html',
    );

    // Fetch all child sources in parallel with queue control
    const results = await Promise.allSettled(
      childSources.map(async (source) => {
        const articles = await this.fetchFeed(source, priority);
        return articles.map((article) => {
          const rawAuthor = article.author?.trim();
          let author = source.label;
          if (rawAuthor) {
            if (rawAuthor.toLowerCase().includes(source.label.toLowerCase())) {
              author = rawAuthor;
            } else {
              author = `${source.label} · ${rawAuthor}`;
            }
          }
          return {
            ...article,
            author,
          };
        });
      }),
    );

    const mergedArticles: NewsArticle[] = [];
    for (const res of results) {
      if (res.status === 'fulfilled') {
        mergedArticles.push(...res.value);
      }
    }

    // Deduplicate and sort by publishedMillis descending (newest first)
    const sorted = dedupeAndSortArticles(mergedArticles);

    this.cache.set(aggregateFeed.key, { articles: sorted, timestamp: Date.now() });
    return sorted;
  }

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;

    try {
      let articles = await fetchAndParseFeed(task.feed.url);
      if (articles.length === 0 && task.feed.homepage) {
        try {
          const domain = new URL(task.feed.homepage).hostname.replace(/^www\./, '');
          const fallbackUrl = `https://news.google.com/rss/search?q=site:${domain}&hl=th&gl=TH&ceid=TH:th`;
          const fallbackArticles = await fetchAndParseFeed(fallbackUrl);
          if (fallbackArticles.length > 0) {
            articles = fallbackArticles;
          }
        } catch {
          // ignore fallback error
        }
      }
      this.cache.set(task.feed.key, { articles, timestamp: Date.now() });
      task.resolve(articles);
    } catch (err) {
      if (task.feed.homepage) {
        try {
          const domain = new URL(task.feed.homepage).hostname.replace(/^www\./, '');
          const fallbackUrl = `https://news.google.com/rss/search?q=site:${domain}&hl=th&gl=TH&ceid=TH:th`;
          const fallbackArticles = await fetchAndParseFeed(fallbackUrl);
          if (fallbackArticles.length > 0) {
            this.cache.set(task.feed.key, { articles: fallbackArticles, timestamp: Date.now() });
            task.resolve(fallbackArticles);
            return;
          }
        } catch {
          // ignore
        }
      }
      task.reject(err);
    } finally {
      this.activeCount--;
      this.processNext();
    }
  }

  /**
   * Prefetch multiple feeds in background without blocking active UI
   */
  prefetchFeeds(feeds: FeedSource[]): void {
    for (const feed of feeds) {
      void this.fetchFeed(feed, 10); // Priority 10 (background)
    }
  }

  invalidateFeedCache(key?: string): void {
    if (!key) {
      this.cache.clear();
      return;
    }
    this.cache.delete(key);
    if (key.startsWith('all:')) {
      const group = this.feedGroups.find((g) => g.sources.some((s) => s.key === key));
      if (group) {
        for (const s of group.sources) {
          this.cache.delete(s.key);
        }
      }
    }
  }

  clearMemoryCache(): void {
    this.cache.clear();
  }
}

export const feedService = new FeedServiceQueue();

