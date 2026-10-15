import he from 'he';
import { FeedGroup } from '../config/categories';
import { articleRepository } from '../data/database/articles';
import { feedService } from './feedService';
import { NewsArticle } from '../types';
import { extractImage, sanitizeImageUrl } from '../utils/content';
import { getDiverseArticleImage } from '../utils/articleVisuals';

const PHP_CACHE_BASE = 'https://pongploydev.infinityfree.me/PHP-source-nearby/home/cache';
const TIMEOUT_MS = 6000;

interface PhpJsonItem {
  id?: string;
  title?: string;
  link?: string;
  description?: string;
  full_text?: string;
  raw_content?: string;
  image?: string;
  author?: string;
  source_key?: string;
  source_label?: string;
  group_key?: string;
  pub_date?: number;
  pub_datetime_thai?: string;
  pub_date_thai?: string;
  time_ago?: string;
  reading_time?: string;
  is_new?: boolean;
}

export class HomeSectionsService {
  /**
   * Fetch articles for a single category group, preferring the pre-computed PHP JSON cache
   * and falling back to feedService aggregate feed if unavailable.
   */
  async fetchCategoryArticles(group: FeedGroup): Promise<NewsArticle[]> {
    // 1. Try fetching from user's PHP JSON cache
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${PHP_CACHE_BASE}/rss_${group.key}.json`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (TechThaiApp)',
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        // InfinityFree or proxies sometimes return HTML splash if blocked
        if (text && text.trim().startsWith('[')) {
          const rawItems = JSON.parse(text) as PhpJsonItem[];
          if (Array.isArray(rawItems) && rawItems.length > 0) {
            const parsedArticles: NewsArticle[] = rawItems.map((item) => {
              const rawTitle = item.title ? he.decode(item.title) : 'ไม่มีหัวข้อ';
              const rawDesc = item.description ? he.decode(item.description) : '';
              const rawContent = item.full_text || item.raw_content || rawDesc;

              let author = item.source_label || item.author || group.label;
              if (item.source_label && item.author && !item.author.includes(item.source_label)) {
                author = `${item.source_label} · ${item.author}`;
              }

              const directOrExtracted = extractImage(
                item.image,
                item.raw_content,
                item.description,
                item.full_text
              );

              return {
                id: item.id || `php-${group.key}-${Math.random().toString(36).substring(2, 9)}`,
                title: rawTitle,
                link: item.link || 'https://techthainews.app',
                description: rawDesc,
                content: rawContent,
                imageUrl: sanitizeImageUrl(directOrExtracted),
                author,
                publishedAt: item.pub_datetime_thai || item.pub_date_thai,
                publishedMillis: item.pub_date ? item.pub_date * 1000 : Date.now(),
                readingTime: item.reading_time ? parseInt(item.reading_time, 10) || 3 : 3,
              };
            });

            feedService.registerArticles(parsedArticles);
            return parsedArticles;
          }
        }
      }
    } catch {
      // PHP cache unreachable or timed out, fallback to local feedService
    }

    // 2. Fallback to aggregate / child feeds via feedService
    try {
      const aggregateSource = group.sources.find((s) => s.type === 'aggregate') || group.sources[0];
      if (aggregateSource) {
        const fetched = await feedService.fetchFeed(aggregateSource, 2);
        if (fetched.length > 0) {
          void articleRepository.saveCachedFeedArticles(group.key, fetched);
          return fetched;
        }
      }
    } catch {
      // local feed fallback failed
    }

    // 3. Fallback to persistent offline cache if network is unavailable
    try {
      const offlineCached = await articleRepository.getCachedFeedArticles(group.key);
      if (offlineCached && offlineCached.length > 0) {
        return offlineCached;
      }
    } catch {
      // offline cache read failed
    }

    return [];
  }

  /**
   * Fetch all category sections concurrently with progress callback
   */
  async fetchAllCategorySections(
    groups: FeedGroup[],
    onProgress?: (progressRatio: number, lastGroupLabel?: string) => void
  ): Promise<Record<string, NewsArticle[]>> {
    let completedCount = 0;
    const totalCount = groups.length;

    const results = await Promise.allSettled(
      groups.map(async (group) => {
        const articles = await this.fetchCategoryArticles(group);
        completedCount++;
        if (onProgress) {
          const ratio = totalCount > 0 ? completedCount / totalCount : 1;
          onProgress(ratio, group.label);
        }
        return { key: group.key, articles };
      })
    );

    const map: Record<string, NewsArticle[]> = {};
    for (const res of results) {
      if (res.status === 'fulfilled' && res.value) {
        map[res.value.key] = res.value.articles;
      }
    }

    // Save to cache in background
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
