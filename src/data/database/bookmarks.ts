import { STORAGE_KEYS } from '../../config/constants';
import { NewsArticle } from '../../types';
import { storage } from './database';

export const bookmarkRepository = {
  async getBookmarks(): Promise<Record<string, NewsArticle>> {
    return (await storage.get<Record<string, NewsArticle>>(STORAGE_KEYS.bookmarks)) || {};
  },

  async saveBookmarks(bookmarks: Record<string, NewsArticle>): Promise<void> {
    await storage.set(STORAGE_KEYS.bookmarks, bookmarks);
  },

  async toggleBookmark(article: NewsArticle): Promise<Record<string, NewsArticle>> {
    const current = await this.getBookmarks();
    const updated = { ...current };
    if (updated[article.id]) {
      delete updated[article.id];
    } else {
      updated[article.id] = article;
    }
    await this.saveBookmarks(updated);
    return updated;
  },

  async clearBookmarks(): Promise<void> {
    await storage.remove(STORAGE_KEYS.bookmarks);
  },
};
