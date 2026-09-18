import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage errors handled gracefully
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // Storage errors handled gracefully
    }
  },

  async multiGet(keys: string[]): Promise<Record<string, string | null>> {
    try {
      const entries = await AsyncStorage.multiGet(keys);
      return Object.fromEntries(entries);
    } catch {
      return {};
    }
  },

  async multiSet(pairs: Array<[string, string]>): Promise<void> {
    try {
      await AsyncStorage.multiSet(pairs);
    } catch {
      // Storage errors handled gracefully
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    try {
      await AsyncStorage.multiRemove(keys);
    } catch {
      // Storage errors handled gracefully
    }
  },
};
