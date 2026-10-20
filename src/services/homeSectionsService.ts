import { FeedGroup } from '../config/categories';
import { getCategoryVisual } from '../config/categoryVisuals';
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
          const cachedBefore = await articleRepository.getCachedFeedArticles(group.key);
          const knownImages = new Map(
            (cachedBefore || []).filter((a) => a.imageUrl).map((a) => [a.id, a.imageUrl]),
          );
          const sorted = dedupeAndSortArticles(merged).map((a) => ({
            ...a,
            imageUrl: a.imageUrl ?? knownImages.get(a.id),
          }));
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
          const cachedBefore = await articleRepository.getCachedFeedArticles(group.key);
          const knownImages = new Map(
            (cachedBefore || []).filter((a) => a.imageUrl).map((a) => [a.id, a.imageUrl]),
          );
          const preserved = fetched.map((a) => ({
            ...a,
            imageUrl: a.imageUrl ?? knownImages.get(a.id),
          }));
          void articleRepository.saveCachedFeedArticles(group.key, preserved);
          return preserved;
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

    // Save all loaded sections to cache in background, strictly keeping only active groups
    if (Object.keys(map).length > 0) {
      const activeKeys = groups.map((g) => g.key);
      void articleRepository.saveCachedCategoryArticles(map, activeKeys);
    }

    return map;
  }

  async getCachedCategorySections(): Promise<Record<string, NewsArticle[]>> {
    return articleRepository.getCachedCategoryArticles();
  }

  /**
   * Extract top featured articles across all categories for the Hero slider
   * Ensures diverse representation across active categories (at most 2 per category)
   */
  getFeaturedHeroArticles(
    categoryMap: Record<string, NewsArticle[]>,
    allowedKeys?: Set<string>,
  ): NewsArticle[] {
    let categories = Object.keys(categoryMap);
    if (allowedKeys && allowedKeys.size > 0) {
      categories = categories.filter((k) => allowedKeys.has(k));
    }
    if (categories.length === 0) return [];

    const allArticles = categories.flatMap((k) => categoryMap[k] || []);
    const seen = new Set<string>();
    const unique: NewsArticle[] = [];

    for (const article of allArticles) {
      if (article && article.id && !seen.has(article.id)) {
        seen.add(article.id);
        unique.push(article);
      }
    }

    unique.sort((a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0));

    // Balanced selection: pick newest while capping at max 2 articles from any single category
    const result: NewsArticle[] = [];
    const catCounts: Record<string, number> = {};

    for (const article of unique) {
      if (result.length >= 6) break;
      let catKey = 'general';
      for (const k of categories) {
        const list = categoryMap[k] || [];
        if (list.some((a) => a.id === article.id)) {
          catKey = k;
          break;
        }
      }
      const count = catCounts[catKey] || 0;
      if (count < 2) {
        catCounts[catKey] = count + 1;
        result.push(article);
      }
    }

    if (result.length < 6) {
      const resultIds = new Set(result.map((a) => a.id));
      for (const article of unique) {
        if (result.length >= 6) break;
        if (!resultIds.has(article.id)) {
          resultIds.add(article.id);
          result.push(article);
        }
      }
    }

    return result;
  }

  /**
   * Extract trending highlight articles by selecting the newest article
   * from each distinct active category (1 per category)
   */
  getTrendingHighlights(
    categoryMap: Record<string, NewsArticle[]>,
    excludeIds: Set<string>,
    limit: number = 6,
    allowedKeys?: Set<string>,
  ): NewsArticle[] {
    let categories = Object.keys(categoryMap);
    if (allowedKeys && allowedKeys.size > 0) {
      categories = categories.filter((k) => allowedKeys.has(k));
    }
    if (categories.length === 0) return [];

    // Priority ordering strictly based on active settings
    const preferredOrder = [
      'tech-business',
      'international',
      'thai-news',
      'mobile',
      'weather-forecast',
      'developer-coding',
    ];

    const sortedCategories = [...categories].sort((a, b) => {
      const idxA = preferredOrder.indexOf(a);
      const idxB = preferredOrder.indexOf(b);
      const priA = idxA === -1 ? 999 : idxA;
      const priB = idxB === -1 ? 999 : idxB;
      return priA - priB;
    });

    // Sort articles in each category queue by newest first
    const categoryQueues = new Map<string, NewsArticle[]>();
    for (const cat of sortedCategories) {
      const articles = (categoryMap[cat] || []).filter((a) => a && a.id && a.title);
      const sorted = [...articles].sort(
        (a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0),
      );
      categoryQueues.set(cat, sorted);
    }

    const seen = new Set<string>(excludeIds);
    const result: NewsArticle[] = [];

    // Pass 1: Select 1 newest article from each distinct category
    for (const cat of sortedCategories) {
      if (result.length >= limit) break;
      const queue = categoryQueues.get(cat);
      if (queue) {
        while (queue.length > 0) {
          const candidate = queue.shift()!;
          if (!seen.has(candidate.id)) {
            seen.add(candidate.id);
            result.push(candidate);
            break; // 1 article per category!
          }
        }
      }
    }

    // Pass 2: If limit not reached, fill remaining round-robin
    if (result.length < limit) {
      let hasMore = true;
      while (hasMore && result.length < limit) {
        hasMore = false;
        for (const cat of sortedCategories) {
          if (result.length >= limit) break;
          const queue = categoryQueues.get(cat);
          if (queue && queue.length > 0) {
            hasMore = true;
            while (queue.length > 0) {
              const candidate = queue.shift()!;
              if (!seen.has(candidate.id)) {
                seen.add(candidate.id);
                result.push(candidate);
                break;
              }
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Extract headlines for Flash Dispatch ticker
   * Selects newest articles across all categories in a balanced round-robin
   * to ensure diverse coverage of 20 fresh articles from every category.
   */
  getFlashTickerArticles(
    categoryMap: Record<string, NewsArticle[]>,
    limit: number = 20,
  ): NewsArticle[] {
    const categories = Object.keys(categoryMap);
    if (categories.length === 0) return [];

    // Sort each category by newest first
    const categoryQueues = new Map<string, NewsArticle[]>();
    for (const cat of categories) {
      const articles = (categoryMap[cat] || []).filter((a) => a && a.id && a.title);
      const sorted = [...articles].sort(
        (a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0),
      );
      categoryQueues.set(cat, sorted);
    }

    const seen = new Set<string>();
    const list: NewsArticle[] = [];

    // Round-robin: take the newest unused article from each category iteratively
    let hasMore = true;
    while (hasMore && list.length < limit) {
      hasMore = false;
      for (const cat of categories) {
        if (list.length >= limit) break;
        const queue = categoryQueues.get(cat);
        if (queue && queue.length > 0) {
          hasMore = true;
          while (queue.length > 0) {
            const candidate = queue.shift()!;
            if (!seen.has(candidate.id)) {
              seen.add(candidate.id);
              // Ensure article has category label if author is missing
              const visual = getCategoryVisual(cat);
              const author = candidate.author?.trim() || visual.shortLabel;
              list.push({ ...candidate, author });
              break;
            }
          }
        }
      }
    }

    return list;
  }
}

export const homeSectionsService = new HomeSectionsService();
