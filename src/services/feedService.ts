import { MAX_CONCURRENT_FEEDS } from '../config/constants';
import { FeedSource } from '../config/feeds';
import { fetchAndParseFeed } from '../data/rss';
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

  constructor(concurrency: number = MAX_CONCURRENT_FEEDS) {
    this.concurrency = concurrency;
  }

  /**
   * Fetch feed with priority and queue control
   */
  async fetchFeed(feed: FeedSource, priority: number = 0): Promise<NewsArticle[]> {
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

  private async processNext(): Promise<void> {
    if (this.activeCount >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const task = this.queue.shift();
    if (!task) return;

    this.activeCount++;

    try {
      const articles = await fetchAndParseFeed(task.feed.url);
      this.cache.set(task.feed.key, { articles, timestamp: Date.now() });
      task.resolve(articles);
    } catch (err) {
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

  clearMemoryCache(): void {
    this.cache.clear();
  }
}

export const feedService = new FeedServiceQueue();
