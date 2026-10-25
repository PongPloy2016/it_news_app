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
import { DEFAULT_FEED_KEY, FEED_GROUPS, FEED_SOURCES, FeedGroup, FeedSource } from '../config';
import { STALE_AFTER_MS } from '../config/constants';
import {
  articleRepository,
  bookmarkRepository,
  historyRepository,
  storage,
} from '../data/database';
import { feedService, imageService, loadFeedConfiguration, supabaseBookmarkService, analyticsService, articleContentService } from '../services';
import {
  DEFAULT_REMOTE_SETTINGS,
  fetchRemoteAppSettings,
  getCachedRemoteAppSettings,
} from '../services/appSettingsService';
import {
  AppColors,
  darkColors,
  fontScale,
  forestColors,
  lightColors,
  midnightColors,
  purpleColors,
  sepiaColors,
  sunsetColors,
  techColors,
} from '../theme';
import {
  AppSettings,
  CardLayoutOption,
  FontSizeOption,
  LanguageOption,
  LinkOpenMode,
  NewsArticle,
  RemoteAppSettings,
  ThemeMode,
} from '../types';
import { resolveLanguage, translations } from '../i18n';

const defaultSettings: AppSettings = {
  themeMode: 'system',
  fontSize: 'medium',
  cardLayout: 'magazine',
  aiReaderEnabled: true,
  linkOpenMode: 'in_app',
  dataSaverEnabled: false,
  cloudSyncEnabled: true,
  language: 'system',
};

interface NewsContextValue {
  articles: NewsArticle[];
  bookmarks: Record<string, NewsArticle>;
  searchHistory: string[];
  settings: AppSettings;
  remoteSettings: RemoteAppSettings;
  selectedFeedKey: string;
  selectedFeed: FeedSource;
  feedGroups: FeedGroup[];
  feedSources: FeedSource[];
  isOnlineFeeds: boolean;
  isHydrated: boolean;
  isRefreshing: boolean;
  isSyncingBookmarks: boolean;
  isCloudSyncActive: boolean;
  hasFetchError: boolean;
  isShowingCachedFeed: boolean;
  lastUpdated?: number;
  isDark: boolean;
  colors: AppColors;
  scale: number;
  refresh: (forceRefresh?: boolean) => Promise<void>;
  syncCloudBookmarks: () => Promise<{ success: boolean; count: number }>;
  importBookmarksFromDevice: (targetDeviceId: string) => Promise<{ success: boolean; count: number; error?: string }>;
  setSelectedFeedKey: (key: string) => void;
  toggleBookmark: (article: NewsArticle) => void;
  addSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  clearBookmarks: () => void;
  clearNewsCache: () => Promise<void>;
  clearReadArticles: () => Promise<void>;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSizeOption) => void;
  setCardLayout: (layout: CardLayoutOption) => void;
  setAiReaderEnabled: (enabled: boolean) => void;
  setLinkOpenMode: (mode: LinkOpenMode) => void;
  setDataSaverEnabled: (enabled: boolean) => void;
  setCloudSyncEnabled: (enabled: boolean) => void;
  language: LanguageOption;
  resolvedLanguage: 'th' | 'en';
  setLanguage: (lang: LanguageOption) => void;
  t: typeof translations.th;
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
  const [feedGroups, setFeedGroups] = useState<FeedGroup[]>(FEED_GROUPS);
  const [feedSources, setFeedSources] = useState<FeedSource[]>(FEED_SOURCES);
  const [isOnlineFeeds, setIsOnlineFeeds] = useState<boolean>(false);
  const [selectedFeedKey, setSelectedFeedKeyState] = useState<string>(DEFAULT_FEED_KEY);
  const [lastUpdated, setLastUpdated] = useState<number>();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingBookmarks, setIsSyncingBookmarks] = useState(false);
  const [hasFetchError, setHasFetchError] = useState(false);
  const [isShowingCachedFeed, setIsShowingCachedFeed] = useState(false);
  const [lastRefreshNewCount, setLastRefreshNewCount] = useState<number>(0);
  const [channelStats, setChannelStats] = useState<Record<string, { total: number; newCount: number }>>({});
  const [remoteSettings, setRemoteSettings] = useState<RemoteAppSettings>(DEFAULT_REMOTE_SETTINGS);

  const isDark =
    settings.themeMode === 'dark' ||
    settings.themeMode === 'midnight' ||
    settings.themeMode === 'tech' ||
    settings.themeMode === 'forest' ||
    settings.themeMode === 'purple' ||
    settings.themeMode === 'sunset' ||
    (settings.themeMode === 'system' && systemScheme === 'dark');

  const colors: AppColors = useMemo(() => {
    switch (settings.themeMode) {
      case 'light':
        return lightColors;
      case 'dark':
        return darkColors;
      case 'midnight':
        return midnightColors;
      case 'sepia':
        return sepiaColors;
      case 'tech':
        return techColors;
      case 'forest':
        return forestColors;
      case 'purple':
        return purpleColors;
      case 'sunset':
        return sunsetColors;
      case 'system':
      default:
        return systemScheme === 'dark' ? darkColors : lightColors;
    }
  }, [settings.themeMode, systemScheme]);
  const selectedFeed = useMemo(
    () => feedSources.find((item) => item.key === selectedFeedKey) ?? feedSources[0] ?? FEED_SOURCES[0],
    [feedSources, selectedFeedKey],
  );
  const previousFeedKeyRef = useRef<string | null>(null);

  // 1. Dynamic Feed Sources & Remote App Settings: Supabase (Online) -> Local (Offline)
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const [config, cachedRemote] = await Promise.all([
          loadFeedConfiguration(),
          getCachedRemoteAppSettings(),
        ]);
        if (isMounted) {
          setFeedGroups(config.groups);
          setFeedSources(config.sources);
          setIsOnlineFeeds(config.isFromSupabase);
          feedService.setFeedGroups(config.groups);
          setRemoteSettings(cachedRemote);

          // Auto-adjust if selected feed belongs to a category that was disabled
          if (config.sources.length > 0 && !config.sources.some((s) => s.key === selectedFeedKey)) {
            setSelectedFeedKeyState(config.sources[0].key);
            void storage.set('blognone.selectedFeedKey', config.sources[0].key);
          }
        }

        // Fetch fresh settings from Supabase
        const freshRemote = await fetchRemoteAppSettings();
        if (isMounted) {
          setRemoteSettings(freshRemote);
        }
      } catch (err) {
        console.warn('[NewsContext] Dynamic feed loading error:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

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

        if (cachedFeedKey) {
          setSelectedFeedKeyState(cachedFeedKey);
          const perFeed = await articleRepository.getCachedFeedArticles(cachedFeedKey);
          if (perFeed && perFeed.length > 0) {
            setArticles(perFeed);
          } else if (cachedArticles?.length) {
            setArticles(cachedArticles);
          }
        } else if (cachedArticles?.length) {
          setArticles(cachedArticles);
        }
        if (cachedBookmarks) setBookmarks(cachedBookmarks);
        if (cachedHistory) setSearchHistory(cachedHistory);
        if (cachedRead) setReadArticles(cachedRead);
        if (cachedSettings) {
          setSettings({
            ...defaultSettings,
            ...cachedSettings,
            cardLayout: cachedSettings.cardLayout ?? 'magazine',
            aiReaderEnabled: cachedSettings.aiReaderEnabled ?? true,
            linkOpenMode: cachedSettings.linkOpenMode ?? 'in_app',
            dataSaverEnabled: cachedSettings.dataSaverEnabled ?? false,
            language: cachedSettings.language ?? 'system',
          });
        }
        if (cachedUpdated) setLastUpdated(cachedUpdated);
      } catch {
        // Fallback gracefully on corrupt cache
      } finally {
        setIsHydrated(true);
      }
    })();
  }, []);

  // 2. Fetch news via Feed Worker Queue
  const refresh = useCallback(
    async (forceRefresh: boolean = true) => {
      if (isRefreshing) return;
      setIsRefreshing(true);

      try {
        let currentFeed = selectedFeed;

        if (forceRefresh) {
          // 1. Clear all in-memory feed cache so all channels reload completely
          feedService.clearMemoryCache();

          // 2. Reload dynamic feeds and remote settings from Supabase (or fallback to local config if offline)
          try {
            const [config, freshRemote] = await Promise.all([
              loadFeedConfiguration(),
              fetchRemoteAppSettings(),
            ]);
            setFeedGroups(config.groups);
            setFeedSources(config.sources);
            setIsOnlineFeeds(config.isFromSupabase);
            feedService.setFeedGroups(config.groups);
            setRemoteSettings(freshRemote);

            const matched = config.sources.find((item) => item.key === selectedFeedKey);
            if (matched) {
              currentFeed = matched;
            } else if (config.sources.length > 0) {
              currentFeed = config.sources[0];
              setSelectedFeedKeyState(config.sources[0].key);
              void storage.set('blognone.selectedFeedKey', config.sources[0].key);
            }
          } catch (configErr) {
            console.warn('[NewsContext] Reload configuration error:', configErr);
          }
        }

        // 3. Fetch via Concurrency Queue with high priority
        const parsed = await feedService.fetchFeed(currentFeed, 0);
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
          [currentFeed.key]: { total: merged.length, newCount: unreadCount },
        }));

        setArticles(merged);
        setLastUpdated(now);
        setHasFetchError(false);
        setIsShowingCachedFeed(false);

        // Persist to storage (both active and per-feed key for instant loading)
        await Promise.all([
          articleRepository.saveCachedArticles(merged),
          articleRepository.saveCachedFeedArticles(currentFeed.key, merged),
          articleRepository.saveLastUpdated(now),
        ]);

        // Enrich images in background
        void imageService.enrichArticlesWithOgImage(merged, (nextArticles) => {
          setArticles(nextArticles);
          void articleRepository.saveCachedArticles(nextArticles);
          void articleRepository.saveCachedFeedArticles(currentFeed.key, nextArticles);
        });

        // Pre-fetch top articles full text in background for instant reading
        void articleContentService.prefetchArticles(merged, 8);
      } catch {
        if (articles.length) setIsShowingCachedFeed(true);
        else setHasFetchError(true);
      } finally {
        setIsRefreshing(false);
      }
    },
    [articles, bookmarks, feedSources, isRefreshing, readArticles, selectedFeed, selectedFeedKey],
  );

  const setSelectedFeedKey = useCallback(
    (key: string) => {
      const nextKey = feedSources.some((item) => item.key === key)
        ? key
        : (feedSources[0]?.key || DEFAULT_FEED_KEY);
      setSelectedFeedKeyState(nextKey);
      void storage.set('blognone.selectedFeedKey', nextKey);

      // Instant Cache First: immediately load cached articles for this feed!
      void (async () => {
        try {
          const cached = await articleRepository.getCachedFeedArticles(nextKey);
          if (cached && cached.length > 0) {
            setArticles(cached);
            setHasFetchError(false);
          }
        } catch {
          // fallback to network fetch
        }
      })();
    },
    [feedSources],
  );

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

  const isCloudSyncActive = useMemo(() => {
    return (settings.cloudSyncEnabled ?? true) && remoteSettings.cloud_sync_enabled !== false;
  }, [settings.cloudSyncEnabled, remoteSettings.cloud_sync_enabled]);

  const syncCloudBookmarks = useCallback(async (): Promise<{ success: boolean; count: number }> => {
    if (!isCloudSyncActive) {
      return { success: false, count: 0 };
    }
    setIsSyncingBookmarks(true);
    try {
      const res = await supabaseBookmarkService.fetchRemoteBookmarks(true);
      if (res.success) {
        const remoteArticles = res.articles;
        const remoteIds = new Set(remoteArticles.map((a) => a.id));

        setBookmarks((current) => {
          const merged = { ...current };

          // 1. Pull down: Add any remote articles to local state
          for (const item of remoteArticles) {
            merged[item.id] = item;
          }

          // 2. Push up: If user has bookmarks locally not yet in Supabase, upload them
          for (const [id, localArticle] of Object.entries(current)) {
            if (!remoteIds.has(id)) {
              void supabaseBookmarkService.saveRemoteBookmark(localArticle);
            }
          }

          void bookmarkRepository.saveBookmarks(merged);
          return merged;
        });
        return { success: true, count: remoteArticles.length };
      }
      return { success: false, count: 0 };
    } catch (err) {
      console.warn('[NewsContext] syncCloudBookmarks error:', err);
      return { success: false, count: 0 };
    } finally {
      setIsSyncingBookmarks(false);
    }
  }, [isCloudSyncActive]);

  const importBookmarksFromDevice = useCallback(
    async (targetDeviceId: string): Promise<{ success: boolean; count: number; error?: string }> => {
      const trimmed = targetDeviceId.trim();
      if (!trimmed) {
        return { success: false, count: 0, error: 'กรุณาระบุ Device ID' };
      }
      try {
        const res = await supabaseBookmarkService.fetchBookmarksByDeviceId(trimmed);
        if (!res.success) {
          return { success: false, count: 0, error: res.error || 'ไม่สามารถดึงข้อมูลได้' };
        }
        if (res.articles.length === 0) {
          return { success: false, count: 0, error: 'ไม่พบข่าวที่บันทึกไว้ใน Device ID นี้' };
        }

        setBookmarks((current) => {
          const merged = { ...current };
          for (const item of res.articles) {
            merged[item.id] = item;
          }
          void bookmarkRepository.saveBookmarks(merged);
          return merged;
        });

        return { success: true, count: res.articles.length };
      } catch (err: any) {
        return { success: false, count: 0, error: err?.message || 'เกิดข้อผิดพลาดในการนำเข้า' };
      }
    },
    [],
  );

  // Background cloud bookmark sync on app launch
  useEffect(() => {
    if (isHydrated && isCloudSyncActive) {
      void syncCloudBookmarks();
    }
  }, [isHydrated, isCloudSyncActive, syncCloudBookmarks]);

  const toggleBookmark = useCallback((article: NewsArticle) => {
    setBookmarks((current) => {
      const next = { ...current };
      const isRemoving = Boolean(next[article.id]);
      if (isRemoving) {
        delete next[article.id];
        if (isCloudSyncActive) {
          void supabaseBookmarkService.removeRemoteBookmark(article.id);
        }
      } else {
        next[article.id] = article;
        if (isCloudSyncActive) {
          void supabaseBookmarkService.saveRemoteBookmark(article);
        }
      }
      void analyticsService.logBookmarkToggle(article.id, article.title, !isRemoving);
      void bookmarkRepository.saveBookmarks(next);
      return next;
    });
  }, [isCloudSyncActive]);

  const addSearchHistory = useCallback((query: string) => {
    void (async () => {
      if (query.trim()) {
        void analyticsService.logSearch(query.trim());
      }
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
    // Intentionally delete ONLY from device (local storage/memory).
    // Do NOT delete from Supabase Cloud.
  }, []);

  const clearNewsCache = useCallback(async () => {
    setArticles([]);
    setLastUpdated(undefined);
    feedService.clearMemoryCache();
    await articleRepository.clearCache();
    await refresh();
  }, [refresh]);

  const clearReadArticles = useCallback(async () => {
    setReadArticles({});
    await articleRepository.clearReadArticles();
    setChannelStats((prev) => ({
      ...prev,
      [selectedFeed.key]: {
        total: articles.length,
        newCount: articles.length,
      },
    }));
  }, [articles.length, selectedFeed.key]);

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
      remoteSettings,
      selectedFeedKey,
      selectedFeed,
      feedGroups,
      feedSources,
      isOnlineFeeds,
      isHydrated,
      isRefreshing,
      isSyncingBookmarks,
      hasFetchError,
      isShowingCachedFeed,
      lastUpdated,
      isDark,
      colors,
      scale: fontScale[settings.fontSize],
      refresh,
      syncCloudBookmarks,
      importBookmarksFromDevice,
      setSelectedFeedKey,
      toggleBookmark,
      addSearchHistory,
      clearSearchHistory,
      clearBookmarks,
      clearNewsCache,
      clearReadArticles,
      setThemeMode: (themeMode) => updateSettings({ ...settings, themeMode }),
      setFontSize: (fontSize) => updateSettings({ ...settings, fontSize }),
      setCardLayout: (cardLayout) => updateSettings({ ...settings, cardLayout }),
      setAiReaderEnabled: (aiReaderEnabled) => updateSettings({ ...settings, aiReaderEnabled }),
      setLinkOpenMode: (linkOpenMode) => updateSettings({ ...settings, linkOpenMode }),
      setDataSaverEnabled: (dataSaverEnabled) => updateSettings({ ...settings, dataSaverEnabled }),
      setCloudSyncEnabled: (cloudSyncEnabled) => updateSettings({ ...settings, cloudSyncEnabled }),
      language: settings.language ?? 'system',
      resolvedLanguage: resolveLanguage(settings.language),
      setLanguage: (language: LanguageOption) => updateSettings({ ...settings, language }),
      t: translations[resolveLanguage(settings.language)],
      isCloudSyncActive,
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
      remoteSettings,
      selectedFeedKey,
      selectedFeed,
      feedGroups,
      feedSources,
      isOnlineFeeds,
      isHydrated,
      isRefreshing,
      isSyncingBookmarks,
      isCloudSyncActive,
      hasFetchError,
      isShowingCachedFeed,
      lastUpdated,
      isDark,
      colors,
      refresh,
      syncCloudBookmarks,
      importBookmarksFromDevice,
      setSelectedFeedKey,
      toggleBookmark,
      addSearchHistory,
      clearSearchHistory,
      clearBookmarks,
      clearNewsCache,
      clearReadArticles,
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
