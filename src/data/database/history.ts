import { STORAGE_KEYS } from '../../config/constants';
import { storage } from './database';

export const historyRepository = {
  async getHistory(): Promise<string[]> {
    return (await storage.get<string[]>(STORAGE_KEYS.history)) || [];
  },

  async saveHistory(history: string[]): Promise<void> {
    await storage.set(STORAGE_KEYS.history, history.slice(0, 10));
  },

  async addQuery(query: string): Promise<string[]> {
    const value = query.trim();
    if (!value) return await this.getHistory();

    const current = await this.getHistory();
    const updated = [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 10);
    await this.saveHistory(updated);
    return updated;
  },

  async clearHistory(): Promise<void> {
    await storage.remove(STORAGE_KEYS.history);
  },
};
