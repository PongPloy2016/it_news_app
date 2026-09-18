export const STORAGE_KEYS = {
  articles: 'blognone.articles',
  bookmarks: 'blognone.bookmarks',
  history: 'blognone.searchHistory',
  settings: 'blognone.settings',
  lastUpdated: 'blognone.lastUpdated',
  selectedFeedKey: 'blognone.selectedFeedKey',
  readArticles: 'blognone.readArticles',
} as const;

export const STALE_AFTER_MS = 30 * 60 * 1_000; // 30 mins

export const PROXY_URL = process.env.EXPO_PUBLIC_RSS_PROXY_URL || '';
export const FEED_URL_OVERRIDE = process.env.EXPO_PUBLIC_RSS_FEED_URL || '';
export const BLOGNONE_HOME = 'https://www.blognone.com';
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_CONCURRENT_FEEDS = 5;
