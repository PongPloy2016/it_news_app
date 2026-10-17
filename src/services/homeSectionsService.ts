import { FeedGroup } from '../config/categories';
import { articleRepository } from '../data/database/articles';
import { dedupeAndSortArticles } from '../data/rss/dedupe';
import { feedService } from './feedService';
import { NewsArticle } from '../types';

export class HomeSectionsService {
  /**
   * Fetch articles for a single category group, preferring high-speed primary feeds
   * and falling back to cached articles if network is unavailable.
   */
  async fetchCategoryArticles(group: FeedGroup, fastMode: boolean = true): Promise<NewsArticle[]> {
    // 1. Fetch from feedService using primary child sources
    try {
      const validSources = group.sources.filter(
        (s) => s.type !== 'aggregate' && s.type !== 'html'
      );

      // In fastMode (e.g. Home Editorial Overview), fetch top 2 primary feeds instead of 5+ feeds
      const sourcesToFetch = fastMode && validSources.length > 2
        ? validSources.slice(0, 2)
        : validSources;

      if (sourcesToFetch.length > 0) {
        const results = await Promise.allSettled(
          sourcesToFetch.map((s) => feedService.fetchFeed(s, 1))
        );

        const merged: NewsArticle[] = [];
        for (const res of results) {
          if (res.status === 'fulfilled' && Array.isArray(res.value) && res.value.length > 0) {
            merged.push(...res.value);
          }
        }

        if (merged.length > 0) {
          const sorted = dedupeAndSortArticles(merged);
          void articleRepository.saveCachedFeedArticles(group.key, sorted);
          return sorted;
        }
      }
    } catch {
      // Feed fetch failed, fallback below
    }

    // 2. Fallback to aggregate feed if direct fetch didn't return articles
    try {
      const aggregateSource = group.sources.find((s) => s.type === 'aggregate') || group.sources[0];
      if (aggregateSource) {
        const fetched = await feedService.fetchFeed(aggregateSource, 2);
        if (fetched && fetched.length > 0) {
          void articleRepository.saveCachedFeedArticles(group.key, fetched);
          return fetched;
        }
      }
    } catch {}

    // 3. Fallback to persistent offline cache if network is unavailable
    try {
      const offlineCached = await articleRepository.getCachedFeedArticles(group.key);
      if (offlineCached && offlineCached.length > 0) {
        return offlineCached;
      }
    } catch {}

    return [];
  }

  /**
   * Fetch all category sections concurrently with real-time streaming callback
   */
  async fetchAllCategorySections(
    groups: FeedGroup[],
    onProgress?: (progressRatio: number, lastGroupLabel?: string) => void,
    onCategoryLoaded?: (categoryKey: string, articles: NewsArticle[]) => void
  ): Promise<Record<string, NewsArticle[]>> {
    let completedCount = 0;
    const totalCount = groups.length;
    const map: Record<string, NewsArticle[]> = {};

    // Sort: Fetch top 3 visible priority categories first, then rest in parallel
    const priorityKeys = new Set(['tech-business', 'international', 'thai-news', 'mobile']);
    const sortedGroups = [...groups].sort((a, b) => {
      const aPri = priorityKeys.has(a.key) ? 1 : 0;
      const bPri = priorityKeys.has(b.key) ? 1 : 0;
      return bPri - aPri;
    });

    const results = await Promise.allSettled(
      sortedGroups.map(async (group) => {
        const articles = await this.fetchCategoryArticles(group, true);
        completedCount++;

        if (articles && articles.length > 0) {
          map[group.key] = articles;
          if (onCategoryLoaded) {
            onCategoryLoaded(group.key, articles);
          }
          // Save incrementally to storage so cache stays warm
          void articleRepository.saveCachedFeedArticles(group.key, articles);
        }

        if (onProgress) {
          const ratio = totalCount > 0 ? completedCount / totalCount : 1;
          onProgress(ratio, group.label);
        }

        return { key: group.key, articles };
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled' && res.value && res.value.articles.length > 0) {
        map[res.value.key] = res.value.articles;
      }
    }

    // Save all loaded sections to cache in background
    if (Object.keys(map).length > 0) {
      void articleRepository.saveCachedCategoryArticles(map);
    }

    return map;
  }

  async getCachedCategorySections(): Promise<Record<string, NewsArticle[]>> {
    return articleRepository.getCachedCategoryArticles();
  }

  /**
   * Extract top featured articles across all categories for the Hero slider
   */
  getFeaturedHeroArticles(categoryMap: Record<string, NewsArticle[]>): NewsArticle[] {
    const allArticles = Object.values(categoryMap).flat();
    const seen = new Set<string>();
    const unique: NewsArticle[] = [];

    for (const article of allArticles) {
      if (article && article.id && !seen.has(article.id)) {
        seen.add(article.id);
        unique.push(article);
      }
    }

    unique.sort((a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0));
    return unique.slice(0, 6);
  }

  /**
   * Extract trending highlight articles (excluding hero articles)
   */
  getTrendingHighlights(
    categoryMap: Record<string, NewsArticle[]>,
    excludeIds: Set<string>,
    limit: number = 4
  ): NewsArticle[] {
    const allArticles = Object.values(categoryMap).flat();
    const seen = new Set<string>(excludeIds);
    const result: NewsArticle[] = [];

    for (const article of allArticles) {
      if (article && article.id && !seen.has(article.id)) {
        seen.add(article.id);
        result.push(article);
        if (result.length >= limit) break;
      }
    }

    return result;
  }

  /**
   * Extract headlines for Flash Dispatch ticker
   */
  getFlashTickerArticles(categoryMap: Record<string, NewsArticle[]>): NewsArticle[] {
    const allArticles = Object.values(categoryMap).flat();
    const seen = new Set<string>();
    const list: NewsArticle[] = [];

    for (const article of allArticles) {
      if (article && article.id && !seen.has(article.id)) {
        seen.add(article.id);
        list.push(article);
        if (list.length >= 10) break;
      }
    }

    return list;
  }
}

export const homeSectionsService = new HomeSectionsService();
