import { STORAGE_KEYS } from '../../config/constants';
import { NewsArticle } from '../../types';
import { storage } from './database';

export const articleRepository = {
  async getCachedArticles(): Promise<NewsArticle[]> {
    return (await storage.get<NewsArticle[]>(STORAGE_KEYS.articles)) || [];
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
};
