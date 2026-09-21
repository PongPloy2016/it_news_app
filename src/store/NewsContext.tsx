import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useColorScheme } from 'react-native';
import { DEFAULT_FEED_KEY, FEED_SOURCES, FeedSource } from '../config';
import { STALE_AFTER_MS } from '../config/constants';
import {
  articleRepository,
  bookmarkRepository,
  historyRepository,
  storage,
} from '../data/database';
import { feedService, imageService } from '../services';
import { AppColors, darkColors, fontScale, lightColors } from '../theme';
import { AppSettings, CardLayoutOption, FontSizeOption, NewsArticle, ThemeMode } from '../types';

const defaultSettings: AppSettings = {
  themeMode: 'system',
  fontSize: 'medium',
  cardLayout: 'magazine',
  aiReaderEnabled: false,
};

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
  refresh: (forceRefresh?: boolean) => Promise<void>;
  setSelectedFeedKey: (key: string) => void;
  toggleBookmark: (article: NewsArticle) => void;
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  clearBookmarks: () => void;
  clearNewsCache: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSizeOption) => void;
  setCardLayout: (layout: CardLayoutOption) => void;
  setAiReaderEnabled: (enabled: boolean) => void;
  readArticles: Record<string, number>;
  markAsRead: (articleId: string) => void;
  markAllAsRead: () => void;
  isArticleNew: (article: NewsArticle) => boolean;
  isArticleFresh: (article: NewsArticle) => boolean;
  isArticleRead: (articleId: string) => boolean;
  lastRefreshNewCount: number;
  clearFreshCount: () => void;
  channelStats: Record<string, { total: number; newCount: number }>;
}

const NewsContext = createContext<NewsContextValue | null>(null);

export function NewsProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [bookmarks, setBookmarks] = useState<Record<string, NewsArticle>>({});
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [readArticles, setReadArticles] = useState<Record<string, number>>({});
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [selectedFeedKey, setSelectedFeedKeyState] = useState<string>(DEFAULT_FEED_KEY);
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasFetchError, setHasFetchError] = useState(false);
  const [isShowingCachedFeed, setIsShowingCachedFeed] = useState(false);
  const [lastRefreshNewCount, setLastRefreshNewCount] = useState<number>(0);
  const [channelStats, setChannelStats] = useState<Record<string, { total: number; newCount: number }>>({});

  const isDark =
    settings.themeMode === 'dark' ||
    (settings.themeMode === 'system' && systemScheme === 'dark');
  const colors = isDark ? darkColors : lightColors;
  const selectedFeed = FEED_SOURCES.find((item) => item.key === selectedFeedKey) ?? FEED_SOURCES[0];
  const previousFeedKeyRef = useRef<string | null>(null);

  // 1. Initial Hydration from Storage
  useEffect(() => {
    void (async () => {
      try {
        const [cachedArticles, cachedBookmarks, cachedHistory, cachedRead, cachedSettings, cachedUpdated, cachedFeedKey] =
          await Promise.all([
            articleRepository.getCachedArticles(),
            bookmarkRepository.getBookmarks(),
            historyRepository.getHistory(),
            articleRepository.getReadArticles(),
            storage.get<Partial<AppSettings>>('blognone.settings'),
            articleRepository.getLastUpdated(),
            storage.get<string>('blognone.selectedFeedKey'),
          ]);

        if (cachedArticles?.length) setArticles(cachedArticles);
        if (cachedBookmarks) setBookmarks(cachedBookmarks);
        if (cachedHistory) setSearchHistory(cachedHistory);
        if (cachedRead) setReadArticles(cachedRead);
        if (cachedSettings) {
          setSettings({
            ...defaultSettings,
            ...cachedSettings,
            cardLayout: cachedSettings.cardLayout ?? 'magazine',
            aiReaderEnabled: false,
          });
        }
        if (cachedUpdated) setLastUpdated(cachedUpdated);
        if (cachedFeedKey) setSelectedFeedKeyState(cachedFeedKey);
      } catch {
        // Fallback gracefully on corrupt cache
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // 2. Fetch news via Feed Worker Queue
  const refresh = useCallback(async (forceRefresh: boolean = true) => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      if (forceRefresh) {
        feedService.invalidateFeedCache(selectedFeed.key);
      }

      // Fetch via Concurrency Queue with high priority
      const parsed = await feedService.fetchFeed(selectedFeed, 0);
      if (!parsed.length) throw new Error('Feed is empty');

      const knownImages = new Map(
        [...articles, ...Object.values(bookmarks)]
          .filter((item) => item.imageUrl)
          .map((item) => [item.id, item.imageUrl]),
      );
      const merged = parsed.map((item) => ({
        ...item,
        imageUrl: item.imageUrl ?? knownImages.get(item.id),
      }));
      const now = Date.now();

      // Detect newly arrived articles
      const previousIds = new Set(articles.map((item) => item.id));
      const newlyArrivedCount =
        articles.length > 0
          ? merged.filter((item) => !previousIds.has(item.id)).length
          : 0;
      if (newlyArrivedCount > 0) {
        setLastRefreshNewCount(newlyArrivedCount);
      }

      // Calculate unread count for current channel
      const unreadCount = merged.filter((item) => !readArticles[item.id]).length;
      setChannelStats((prev) => ({
        ...prev,
        [selectedFeed.key]: { total: merged.length, newCount: unreadCount },
      }));

      setArticles(merged);
      setLastUpdated(now);
      setHasFetchError(false);
      setIsShowingCachedFeed(false);

      // Persist to storage
      await Promise.all([
        articleRepository.saveCachedArticles(merged),
        articleRepository.saveLastUpdated(now),
      ]);

      // Enrich images in background
      void imageService.enrichArticlesWithOgImage(merged, (nextArticles) => {
        setArticles(nextArticles);
        void articleRepository.saveCachedArticles(nextArticles);
      });
    } catch {
      if (articles.length) setIsShowingCachedFeed(true);
      else setHasFetchError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [articles, bookmarks, isRefreshing, readArticles, selectedFeed]);

  const setSelectedFeedKey = useCallback((key: string) => {
    const nextKey = FEED_SOURCES.some((item) => item.key === key) ? key : DEFAULT_FEED_KEY;
    setSelectedFeedKeyState(nextKey);
    void storage.set('blognone.selectedFeedKey', nextKey);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const shouldRefreshOnFeedChange =
      previousFeedKeyRef.current !== null && previousFeedKeyRef.current !== selectedFeedKey;
    previousFeedKeyRef.current = selectedFeedKey;
    if (shouldRefreshOnFeedChange) {
      void refresh(false);
    } else if (!lastUpdated || Date.now() - lastUpdated > STALE_AFTER_MS) {
      void refresh(true);
    }
  }, [isHydrated, lastUpdated, refresh, selectedFeedKey]);

  const toggleBookmark = useCallback((article: NewsArticle) => {
    setBookmarks((current) => {
      const next = { ...current };
      if (next[article.id]) delete next[article.id];
      else next[article.id] = article;
      void bookmarkRepository.saveBookmarks(next);
      return next;
    });
  }, []);

  const addSearchHistory = useCallback((query: string) => {
    void (async () => {
      const updated = await historyRepository.addQuery(query);
      setSearchHistory(updated);
    })();
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
    void historyRepository.clearHistory();
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks({});
    void bookmarkRepository.clearBookmarks();
  }, []);

  const clearNewsCache = useCallback(async () => {
    setArticles([]);
    setLastUpdated(undefined);
    feedService.clearMemoryCache();
    await articleRepository.clearCache();
    await refresh();
  }, [refresh]);

  const updateSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    void storage.set('blognone.settings', next);
  }, []);

  const clearFreshCount = useCallback(() => {
    setLastRefreshNewCount(0);
  }, []);

  const markAsRead = useCallback(
    (articleId: string) => {
      setReadArticles((prev) => {
        if (prev[articleId]) return prev;
        const next = { ...prev, [articleId]: Date.now() };
        void articleRepository.saveReadArticles(next);
        return next;
      });
      setChannelStats((prev) => {
        const current = prev[selectedFeed.key];
        if (!current) return prev;
        return {
          ...prev,
          [selectedFeed.key]: {
            ...current,
            newCount: Math.max(0, current.newCount - 1),
          },
        };
      });
    },
    [selectedFeed.key],
  );

  const markAllAsRead = useCallback(() => {
    setReadArticles((prev) => {
      const now = Date.now();
      const next = { ...prev };
      for (const item of articles) {
        next[item.id] = now;
      }
      void articleRepository.saveReadArticles(next);
      return next;
    });
    setChannelStats((prev) => ({
      ...prev,
      [selectedFeed.key]: {
        total: articles.length,
        newCount: 0,
      },
    }));
    setLastRefreshNewCount(0);
  }, [articles, selectedFeed.key]);

  const isArticleRead = useCallback(
    (articleId: string) => Boolean(readArticles[articleId]),
    [readArticles],
  );

  const isArticleFresh = useCallback(
    (article: NewsArticle) => {
      if (readArticles[article.id]) return false;
      if (article.publishedMillis) {
        const hoursAgo = (Date.now() - article.publishedMillis) / (1000 * 60 * 60);
        return hoursAgo <= 3;
      }
      return false;
    },
    [readArticles],
  );

  const isArticleNew = useCallback(
    (article: NewsArticle) => {
      if (readArticles[article.id]) return false;
      if (article.publishedMillis) {
        const hoursAgo = (Date.now() - article.publishedMillis) / (1000 * 60 * 60);
        return hoursAgo <= 24;
      }
      return true;
    },
    [readArticles],
  );

  const value = useMemo<NewsContextValue>(
    () => ({
      articles,
      bookmarks,
      searchHistory,
      settings,
      selectedFeedKey,
      selectedFeed,
      isHydrated,
      isRefreshing,
      hasFetchError,
      isShowingCachedFeed,
      lastUpdated,
      isDark,
      colors,
      scale: fontScale[settings.fontSize],
      refresh,
      setSelectedFeedKey,
      toggleBookmark,
      addSearchHistory,
      clearSearchHistory,
      clearBookmarks,
      clearNewsCache,
      setThemeMode: (themeMode) => updateSettings({ ...settings, themeMode }),
      setFontSize: (fontSize) => updateSettings({ ...settings, fontSize }),
      setCardLayout: (cardLayout) => updateSettings({ ...settings, cardLayout }),
      setAiReaderEnabled: (aiReaderEnabled) => updateSettings({ ...settings, aiReaderEnabled }),
      readArticles,
      markAsRead,
      markAllAsRead,
      isArticleNew,
      isArticleFresh,
      isArticleRead,
      lastRefreshNewCount,
      clearFreshCount,
      channelStats,
    }),
    [
      articles,
      bookmarks,
      searchHistory,
      settings,
      selectedFeedKey,
      selectedFeed,
      isHydrated,
      isRefreshing,
      hasFetchError,
      isShowingCachedFeed,
      lastUpdated,
      isDark,
      colors,
      refresh,
      setSelectedFeedKey,
      toggleBookmark,
      addSearchHistory,
      clearSearchHistory,
      clearBookmarks,
      clearNewsCache,
      updateSettings,
      readArticles,
      markAsRead,
      markAllAsRead,
      isArticleNew,
      isArticleFresh,
      isArticleRead,
      lastRefreshNewCount,
      clearFreshCount,
      channelStats,
    ],
  );

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>;
}

export function useNews(): NewsContextValue {
  const value = useContext(NewsContext);
  if (!value) throw new Error('useNews must be used inside NewsProvider');
  return value;
}
