import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { DEFAULT_FEED_KEY, FEED_SOURCES, FEED_URL, FeedSource, PROXY_URL } from '../config';
import { parseFeed } from '../data/rss';
import { AppSettings, FontSizeOption, NewsArticle, ThemeMode } from '../types';
import { AppColors, darkColors, fontScale, lightColors } from '../theme';
import { extractOgImage } from '../utils/content';

const STORAGE = {
  articles: 'blognone.articles', bookmarks: 'blognone.bookmarks',
  history: 'blognone.searchHistory', settings: 'blognone.settings',
  lastUpdated: 'blognone.lastUpdated', selectedFeedKey: 'blognone.selectedFeedKey',
} as const;
const defaultSettings: AppSettings = { themeMode: 'system', fontSize: 'medium' };
const STALE_AFTER_MS = 30 * 60 * 1_000;

interface NewsContextValue {
  articles: NewsArticle[];
  bookmarks: Record<string, NewsArticle>;
  searchHistory: string[];
  settings: AppSettings;
  selectedFeedKey: string;
  selectedFeed: FeedSource;
  isHydrated: boolean;
  isRefreshing: boolean;
  hasFetchError: boolean;
  isShowingCachedFeed: boolean;
  lastUpdated?: number;
  isDark: boolean;
  colors: AppColors;
  scale: number;
  refresh: () => Promise<void>;
  setSelectedFeedKey: (key: string) => void;
  toggleBookmark: (article: NewsArticle) => void;
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  clearBookmarks: () => void;
  clearNewsCache: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSizeOption) => void;
}

const NewsContext = createContext<NewsContextValue | null>(null);

function resolveUrl(feedUrl: string = FEED_URL): string {
  if (!PROXY_URL) return feedUrl;
  const encoded = encodeURIComponent(feedUrl);
  if (PROXY_URL.includes('{url}')) return PROXY_URL.replace('{url}', encoded);
  return `${PROXY_URL}${PROXY_URL.includes('?') ? '&' : '?'}url=${encoded}`;
}

export function NewsProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [bookmarks, setBookmarks] = useState<Record<string, NewsArticle>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [selectedFeedKey, setSelectedFeedKeyState] = useState<string>(DEFAULT_FEED_KEY);
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetchError, setHasFetchError] = useState(false);
  const [isShowingCachedFeed, setIsShowingCachedFeed] = useState(false);

  const isDark = settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  const selectedFeed = FEED_SOURCES.find((item) => item.key === selectedFeedKey) ?? FEED_SOURCES[0];
  const previousFeedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    void (async () => {
      const values = await AsyncStorage.multiGet(Object.values(STORAGE));
      const saved = Object.fromEntries(values);
      try {
        const cachedArticles = saved[STORAGE.articles];
        const cachedBookmarks = saved[STORAGE.bookmarks];
        const cachedHistory = saved[STORAGE.history];
        const cachedSettings = saved[STORAGE.settings];
        const cachedUpdated = saved[STORAGE.lastUpdated];
        const cachedFeedKey = saved[STORAGE.selectedFeedKey];
        if (cachedArticles) setArticles(JSON.parse(cachedArticles));
        if (cachedBookmarks) setBookmarks(JSON.parse(cachedBookmarks));
        if (cachedHistory) setSearchHistory(JSON.parse(cachedHistory));
        if (cachedSettings) setSettings(JSON.parse(cachedSettings));
        if (cachedUpdated) setLastUpdated(Number(cachedUpdated));
        if (cachedFeedKey) setSelectedFeedKeyState(String(cachedFeedKey));
      } catch {
        // Ignore an invalid legacy cache and fetch a fresh feed.
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  const persistArticles = useCallback(async (next: NewsArticle[]) => {
    await AsyncStorage.setItem(STORAGE.articles, JSON.stringify(next.slice(0, 100)));
  }, []);

  const enrichImages = useCallback(async (source: NewsArticle[]) => {
    const pending = source.filter((item) => !item.imageUrl).slice(0, 20);
    await Promise.all(pending.map(async (article) => {
      try {
        const response = await fetch(article.link);
        if (!response.ok) return;
        const imageUrl = extractOgImage(await response.text());
        if (!imageUrl) return;
        setArticles((current) => {
          const next = current.map((item) =>
            item.id === article.id && !item.imageUrl ? { ...item, imageUrl } : item,
          );
          void persistArticles(next);
          return next;
        });
      } catch {
        // Cover enrichment is best-effort.
      }
    }));
  }, [persistArticles]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (selectedFeed.type === 'html') {
        const htmlArticle: NewsArticle = {
          id: `html:${selectedFeed.key}`,
          title: selectedFeed.label,
          link: selectedFeed.url,
          description: `เว็บไซต์ ${selectedFeed.label}`,
          content: selectedFeed.url,
          readingTime: 1,
          publishedMillis: Date.now(),
        };
        const now = Date.now();
        setArticles([htmlArticle]);
        setLastUpdated(now);
        setHasFetchError(false);
        setIsShowingCachedFeed(false);
        await AsyncStorage.multiSet([
          [STORAGE.articles, JSON.stringify([htmlArticle].slice(0, 100))],
          [STORAGE.lastUpdated, String(now)],
        ]);
        return;
      }

      const response = await fetch(resolveUrl(selectedFeed.url), {
        headers: { Accept: 'application/atom+xml, application/rss+xml, application/xml' },
      });
      if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
      const parsed = parseFeed(await response.text());
      if (!parsed.length) throw new Error('Feed is empty');
      const knownImages = new Map(
        [...articles, ...Object.values(bookmarks)].filter((item) => item.imageUrl)
          .map((item) => [item.id, item.imageUrl]),
      );
      const merged = parsed.map((item) => ({ ...item, imageUrl: item.imageUrl ?? knownImages.get(item.id) }));
      const now = Date.now();
      setArticles(merged);
      setLastUpdated(now);
      setHasFetchError(false);
      setIsShowingCachedFeed(false);
      await AsyncStorage.multiSet([
        [STORAGE.articles, JSON.stringify(merged.slice(0, 100))],
        [STORAGE.lastUpdated, String(now)],
      ]);
      void enrichImages(merged);
    } catch {
      if (articles.length) setIsShowingCachedFeed(true);
      else setHasFetchError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [articles, bookmarks, enrichImages, isRefreshing, selectedFeed]);

  const setSelectedFeedKey = useCallback((key: string) => {
    const nextKey = FEED_SOURCES.some((item) => item.key === key) ? key : DEFAULT_FEED_KEY;
    setSelectedFeedKeyState(nextKey);
    void AsyncStorage.setItem(STORAGE.selectedFeedKey, nextKey);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const shouldRefreshOnFeedChange = previousFeedKeyRef.current !== null && previousFeedKeyRef.current !== selectedFeedKey;
    previousFeedKeyRef.current = selectedFeedKey;
    if (shouldRefreshOnFeedChange || !lastUpdated || Date.now() - lastUpdated > STALE_AFTER_MS) void refresh();
  }, [isHydrated, lastUpdated, refresh, selectedFeedKey]);

  const toggleBookmark = useCallback((article: NewsArticle) => {
    setBookmarks((current) => {
      const next = { ...current };
      if (next[article.id]) delete next[article.id];
      else next[article.id] = article;
      void AsyncStorage.setItem(STORAGE.bookmarks, JSON.stringify(next));
      return next;
    });
  }, []);

  const addSearchHistory = useCallback((query: string) => {
    const value = query.trim();
    if (!value) return;
    setSearchHistory((current) => {
      const next = [value, ...current.filter((item) => item.toLowerCase() !== value.toLowerCase())].slice(0, 10);
      void AsyncStorage.setItem(STORAGE.history, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    void AsyncStorage.removeItem(STORAGE.history);
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks({});
    void AsyncStorage.removeItem(STORAGE.bookmarks);
  }, []);

  const clearNewsCache = useCallback(async () => {
    setArticles([]);
    setLastUpdated(undefined);
    await AsyncStorage.multiRemove([STORAGE.articles, STORAGE.lastUpdated]);
    await refresh();
  }, [refresh]);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    void AsyncStorage.setItem(STORAGE.settings, JSON.stringify(next));
  }, []);

  const value = useMemo<NewsContextValue>(() => ({
    articles, bookmarks, searchHistory, settings, selectedFeedKey, selectedFeed,
    isHydrated, isRefreshing, hasFetchError, isShowingCachedFeed, lastUpdated,
    isDark, colors, scale: fontScale[settings.fontSize], refresh,
    setSelectedFeedKey, toggleBookmark, addSearchHistory,
    clearSearchHistory, clearBookmarks, clearNewsCache,
    setThemeMode: (themeMode) => updateSettings({ ...settings, themeMode }),
    setFontSize: (fontSize) => updateSettings({ ...settings, fontSize }),
  }), [
    articles, bookmarks, searchHistory, settings, selectedFeedKey, selectedFeed,
    isHydrated, isRefreshing, hasFetchError, isShowingCachedFeed,
    lastUpdated, isDark, colors, refresh, setSelectedFeedKey,
    toggleBookmark, addSearchHistory, clearSearchHistory, clearBookmarks,
    clearNewsCache, updateSettings,
  ]);

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsContextValue {
  const value = useContext(NewsContext);
  if (!value) throw new Error('useNews must be used inside NewsProvider');
  return value;
}
