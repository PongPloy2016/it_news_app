import { STORAGE_KEYS } from '../../config/constants';
import { NewsArticle } from '../../types';
import { sanitizeImageUrl } from '../../utils/content';
import { storage } from './database';

export const articleRepository = {
  async getCachedArticles(): Promise<NewsArticle[]> {
    const list = (await storage.get<NewsArticle[]>(STORAGE_KEYS.articles)) || [];
    return list.map((item) => ({
      ...item,
      imageUrl: sanitizeImageUrl(item.imageUrl),
    }));
  },

  async saveCachedArticles(articles: NewsArticle[], limit: number = 100): Promise<void> {
    await storage.set(STORAGE_KEYS.articles, articles.slice(0, limit));
  },

  async getLastUpdated(): Promise<number | undefined> {
    const raw = await storage.get<number>(STORAGE_KEYS.lastUpdated);
    return raw ? Number(raw) : undefined;
  },

  async saveLastUpdated(timestamp: number): Promise<void> {
    await storage.set(STORAGE_KEYS.lastUpdated, timestamp);
  },

  async getReadArticles(): Promise<Record<string, number>> {
    return (await storage.get<Record<string, number>>(STORAGE_KEYS.readArticles)) || {};
  },

  async saveReadArticles(readMap: Record<string, number>): Promise<void> {
    await storage.set(STORAGE_KEYS.readArticles, readMap);
  },

  async clearCache(): Promise<void> {
    await storage.multiRemove([STORAGE_KEYS.articles, STORAGE_KEYS.lastUpdated]);
  },

  async clearReadArticles(): Promise<void> {
    await storage.remove(STORAGE_KEYS.readArticles);
  },

  async getCachedFeedArticles(feedKey: string): Promise<NewsArticle[]> {
    const list = (await storage.get<NewsArticle[]>(`blognone.feed_${feedKey}`)) || [];
    return list.map((item) => ({
      ...item,
      imageUrl: sanitizeImageUrl(item.imageUrl),
    }));
  },

  async saveCachedFeedArticles(feedKey: string, articles: NewsArticle[], limit: number = 60): Promise<void> {
    if (!articles || articles.length === 0) return;
    await storage.set(`blognone.feed_${feedKey}`, articles.slice(0, limit));
  },

  async getCachedCategoryArticles(): Promise<Record<string, NewsArticle[]>> {
    const raw = (await storage.get<Record<string, NewsArticle[]>>('blognone.categoryArticles')) || {};
    const sanitized: Record<string, NewsArticle[]> = {};
    for (const [key, list] of Object.entries(raw)) {
      sanitized[key] = (list || []).map((item) => ({
        ...item,
        imageUrl: sanitizeImageUrl(item.imageUrl),
      }));
    }
    return sanitized;
  },

  async saveCachedCategoryArticles(data: Record<string, NewsArticle[]>): Promise<void> {
    if (!data || Object.keys(data).length === 0) return;
    const existing = (await storage.get<Record<string, NewsArticle[]>>('blognone.categoryArticles')) || {};
    const merged: Record<string, NewsArticle[]> = { ...existing };

    for (const [key, list] of Object.entries(data)) {
      if (list && list.length > 0) {
        merged[key] = list;
        // Also save to per-feed cache for instant tab switching
        void storage.set(`blognone.feed_${key}`, list.slice(0, 50));
      }
    }
    await storage.set('blognone.categoryArticles', merged);
  },
};

