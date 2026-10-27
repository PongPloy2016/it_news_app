import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { UnderlineTabItem } from '../../components/UnderlineTabBar';
import { articleRepository } from '../../data/database/articles';
import { feedService } from '../../services/feedService';
import { homeSectionsService } from '../../services/homeSectionsService';
import { imageService } from '../../services/imageService';
import { showInterstitialAndNavigate } from '../../services/interstitialService';
import { analyticsService } from '../../services/analyticsService';
import { useNews } from '../../store/NewsContext';
import { CardLayoutOption, NewsArticle, RootStackParamList } from '../../types';
import { GROUP_ICONS, PAGE_SIZE } from './constants';
import { LatestViewModel, StatusFilter } from './types';

export function useLatestViewModel(): LatestViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {
    feedGroups,
    articles,
    bookmarks,
    colors,
    scale,
    isDark,
    settings,
    setCardLayout,
    isHydrated,
    isRefreshing,
    hasFetchError,
    isShowingCachedFeed,
    lastUpdated,
    refresh,
    selectedFeed,
    selectedFeedKey,
    setSelectedFeedKey,
    activeGroupKey,
    setActiveGroupKey,
    toggleBookmark,
    markAsRead,
    markAllAsRead,
    isArticleNew,
    isArticleRead,
    lastRefreshNewCount,
    clearFreshCount,
  } = useNews();

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Home Editorial category sections state
  const [categorySections, setCategorySections] = useState<Record<string, NewsArticle[]>>({});
  const [isSectionsLoading, setIsSectionsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0.12);
  const [loadingStageText, setLoadingStageText] = useState('กำลังเชื่อมต่อแหล่งข่าว...');
  const [categoryLayouts, setCategoryLayouts] = useState<Record<string, number>>({});
  const homeScrollRef = useRef<ScrollView | null>(null);

  // Initial loading & feed switching state
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSwitchingFeed, setIsSwitchingFeed] = useState(false);
  const prevFeedKeyRef = useRef(selectedFeedKey);
  const enrichedHomeIdsRef = useRef<Set<string>>(new Set());

  // Track screen view with Thai category name whenever tab switches
  useEffect(() => {
    if (activeGroupKey === 'all') {
      void analyticsService.logScreenView(
        'หน้าแรก - รวมทุกหมวด',
        'LatestScreen',
        { page_title: 'หน้าแรก - รวมทุกหมวด', category: 'รวมทุกหมวด', category_id: 'all' },
      );
    } else {
      const group = feedGroups.find((g) => g.key === activeGroupKey);
      if (group) {
        void analyticsService.logScreenView(
          `หมวดหมู่ - ${group.label}`,
          'LatestScreen',
          { page_title: `หมวดหมู่ - ${group.label}`, category: group.label, category_id: group.key },
        );
      }
    }
  }, [activeGroupKey, feedGroups]);

  const activeGroup = useMemo(
    () =>
      feedGroups.find((group) => group.key === activeGroupKey) ??
      feedGroups.find((group) => group.sources.some((item) => item.key === selectedFeedKey)) ??
      feedGroups[0],
    [feedGroups, activeGroupKey, selectedFeedKey],
  );

  const newArticlesCount = useMemo(
    () => articles.filter(isArticleNew).length,
    [articles, isArticleNew],
  );

  const readArticlesCount = useMemo(
    () => articles.filter((item) => isArticleRead(item.id)).length,
    [articles, isArticleRead],
  );

  const filteredArticles = useMemo(() => {
    if (statusFilter === 'new') return articles.filter(isArticleNew);
    if (statusFilter === 'read') return articles.filter((item) => isArticleRead(item.id));
    return articles;
  }, [articles, isArticleNew, isArticleRead, statusFilter]);

  useEffect(() => {
    setVisibleCount((current) =>
      Math.min(Math.max(current, PAGE_SIZE), filteredArticles.length || PAGE_SIZE),
    );
  }, [filteredArticles.length]);

  // Load category sections on mount (offline cache first, then fetch fresh)
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const cached = await homeSectionsService.getCachedCategorySections();
        const activeKeySet = new Set(feedGroups.map((g) => g.key));

        const filteredCached: Record<string, NewsArticle[]> = {};
        for (const [k, list] of Object.entries(cached)) {
          if (activeKeySet.size === 0 || activeKeySet.has(k)) {
            filteredCached[k] = list;
          }
        }

        if (isMounted && Object.keys(filteredCached).length > 0) {
          setCategorySections(filteredCached);
          setIsSectionsLoading(false);
          setLoadProgress(0.85);
          setLoadingStageText('โหลดข้อมูลแคชเรียบร้อยแล้ว');
        } else if (isMounted && articles.length > 0) {
          setCategorySections({ 'tech-business': articles });
          setIsSectionsLoading(false);
          setLoadProgress(0.4);
          setLoadingStageText('แสดงข่าวล่าสุดเบื้องต้น...');
        }

        if (feedGroups.length > 0) {
          const fresh = await homeSectionsService.fetchAllCategorySections(
            feedGroups,
            (ratio, label) => {
              if (isMounted) {
                setLoadProgress(0.15 + ratio * 0.85);
                if (label) {
                  setLoadingStageText(`กำลังโหลด${label}...`);
                }
              }
            },
            (categoryKey, catArticles) => {
              if (isMounted && catArticles.length > 0 && activeKeySet.has(categoryKey)) {
                setCategorySections((prev) => {
                  const next: Record<string, NewsArticle[]> = {};
                  for (const [k, v] of Object.entries(prev)) {
                    if (activeKeySet.has(k)) {
                      next[k] = v;
                    }
                  }
                  next[categoryKey] = catArticles;
                  return next;
                });
                setIsSectionsLoading(false);
              }
            },
          );
          if (isMounted && Object.keys(fresh).length > 0) {
            const nextFresh: Record<string, NewsArticle[]> = {};
            for (const [k, v] of Object.entries(fresh)) {
              if (activeKeySet.has(k)) {
                nextFresh[k] = v;
              }
            }
            setCategorySections(nextFresh);
            setLoadProgress(1);
            setLoadingStageText('โหลดข้อมูลข่าวสารครบถ้วนแล้ว');
          }
        }
      } catch (err) {
        console.warn('[useLatestViewModel] Category sections load error:', err);
      } finally {
        if (isMounted) setIsSectionsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [feedGroups]);

  // Immediate warm start: if articles load into context while categorySections is empty, unblock immediately
  useEffect(() => {
    if (articles.length > 0 && Object.keys(categorySections).length === 0) {
      setCategorySections({ 'tech-business': articles });
      setIsSectionsLoading(false);
    }
  }, [articles, categorySections]);

  // Enrich home articles without images with real OpenGraph thumbnails from web
  useEffect(() => {
    const allArticles = Object.values(categorySections).flat();
    const needImages = allArticles
      .filter((a) => !a.imageUrl && !enrichedHomeIdsRef.current.has(a.id))
      .slice(0, 20);

    if (needImages.length === 0) return;

    for (const a of needImages) {
      enrichedHomeIdsRef.current.add(a.id);
    }

    void imageService.enrichArticlesWithOgImage(needImages, (updated) => {
      const updatedMap = new Map(updated.map((item) => [item.id, item]));
      setCategorySections((prev) => {
        let hasChange = false;
        const next: Record<string, NewsArticle[]> = {};
        for (const [k, list] of Object.entries(prev)) {
          next[k] = list.map((item) => {
            const enriched = updatedMap.get(item.id);
            if (enriched && enriched.imageUrl && enriched.imageUrl !== item.imageUrl) {
              hasChange = true;
              return { ...item, imageUrl: enriched.imageUrl };
            }
            return item;
          });
        }
        if (hasChange) {
          void articleRepository.saveCachedCategoryArticles(next);
          feedService.registerArticles(Array.from(updatedMap.values()));
          return next;
        }
        return prev;
      });
    });
  }, [categorySections]);


  useEffect(() => {
    if (articles.length > 0 || Object.keys(categorySections).length > 0) {
      setIsInitialLoading(false);
      setIsSwitchingFeed(false);
    }
  }, [articles.length, categorySections]);

  useEffect(() => {
    if (prevFeedKeyRef.current !== selectedFeedKey) {
      prevFeedKeyRef.current = selectedFeedKey;
      if (!articles.length) {
        setIsSwitchingFeed(true);
      }
    }
  }, [selectedFeedKey, articles.length]);

  useEffect(() => {
    if (isSwitchingFeed && !isRefreshing) {
      const timer = setTimeout(() => {
        setIsSwitchingFeed(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isSwitchingFeed, isRefreshing]);

  const handleRefreshAll = async (force: boolean = true) => {
    setLoadProgress(0.12);
    setLoadingStageText('กำลังเริ่มดึงข้อมูลข่าวสาร...');
    await Promise.allSettled([
      refresh(force),
      (async () => {
        if (feedGroups.length > 0) {
          const fresh = await homeSectionsService.fetchAllCategorySections(
            feedGroups,
            (ratio, label) => {
              setLoadProgress(0.15 + ratio * 0.85);
              if (label) {
                setLoadingStageText(`กำลังอัปเดต${label}...`);
              }
            },
            (categoryKey, catArticles) => {
              const activeKeySet = new Set(feedGroups.map((g) => g.key));
              if (catArticles.length > 0 && activeKeySet.has(categoryKey)) {
                setCategorySections((prev) => {
                  const next: Record<string, NewsArticle[]> = {};
                  for (const [k, v] of Object.entries(prev)) {
                    if (activeKeySet.has(k)) {
                      next[k] = v;
                    }
                  }
                  next[categoryKey] = catArticles;
                  return next;
                });
              }
            },
          );
          setCategorySections((prev) => {
            const activeKeySet = new Set(feedGroups.map((g) => g.key));
            const prevKnown = new Map(
              Object.values(prev)
                .flat()
                .filter((a) => a.imageUrl)
                .map((a) => [a.id, a.imageUrl]),
            );
            const preserved: Record<string, NewsArticle[]> = {};
            for (const [k, list] of Object.entries(fresh)) {
              if (activeKeySet.has(k)) {
                preserved[k] = list.map((a) => ({
                  ...a,
                  imageUrl: a.imageUrl ?? prevKnown.get(a.id),
                }));
              }
            }
            void articleRepository.saveCachedCategoryArticles(preserved, Array.from(activeKeySet));
            return preserved;
          });
          setLoadProgress(1);
        }
      })(),
    ]);
  };

  const handlePressArticle = (
    item: NewsArticle,
    customArticles?: NewsArticle[],
    categoryKey?: string,
    categoryLabel?: string,
  ) => {
    markAsRead(item.id);
    void showInterstitialAndNavigate(() => {
      let targetArticles = customArticles;
      let resolvedCatKey = categoryKey;
      let resolvedCatLabel = categoryLabel;

      if (!targetArticles || targetArticles.length === 0) {
        for (const [gKey, gList] of Object.entries(categorySections)) {
          if (gList.some((a) => a.id === item.id)) {
            targetArticles = gList;
            resolvedCatKey = gKey;
            const grp = feedGroups.find((g) => g.key === gKey);
            if (grp) resolvedCatLabel = grp.label;
            break;
          }
        }
      }

      if (!targetArticles || targetArticles.length === 0) {
        if (activeGroupKey !== 'all' && activeGroup) {
          targetArticles = filteredArticles;
          resolvedCatKey = activeGroup.key;
          resolvedCatLabel = activeGroup.label;
        } else {
          if (item.author) {
            const authorLower = item.author.toLowerCase();
            const matched = feedGroups.find((g) =>
              g.sources.some(
                (s) =>
                  authorLower.includes(s.label.toLowerCase()) ||
                  s.label.toLowerCase().includes(authorLower),
              ),
            );
            if (matched) {
              resolvedCatKey = matched.key;
              resolvedCatLabel = matched.label;
              if (categorySections[matched.key]?.length > 0) {
                targetArticles = categorySections[matched.key];
              }
            }
          }
        }
      }

      if (!targetArticles || targetArticles.length === 0) {
        targetArticles = filteredArticles;
      }

      navigation.navigate('Article', {
        articleId: item.id,
        article: item,
        articles: targetArticles,
        categoryKey: resolvedCatKey,
        categoryLabel: resolvedCatLabel,
      });
    });
  };

  const handleViewAllCategory = (groupKey: string) => {
    setActiveGroupKey(groupKey);
    const grp = feedGroups.find((g) => g.key === groupKey);
    if (grp?.sources[0]) {
      setSelectedFeedKey(grp.sources[0].key);
    }
    if (grp) {
      void analyticsService.logCategoryView(grp.key, grp.label, 'section_view_all');
    }
  };

  const handleSelectCategoryQuickNav = (groupKey: string) => {
    const grp = feedGroups.find((g) => g.key === groupKey);
    if (grp) {
      void analyticsService.logCategoryView(grp.key, grp.label, 'quick_nav');
    }
    const y = categoryLayouts[groupKey];
    if (y !== undefined) {
      homeScrollRef.current?.scrollTo({ y, animated: true });
    } else {
      handleViewAllCategory(groupKey);
    }
  };

  const handleCategoryTabChange = (key: string) => {
    setActiveGroupKey(key);
    if (key !== 'all') {
      const group = feedGroups.find((g) => g.key === key);
      const firstFeed = group?.sources[0];
      if (firstFeed) setSelectedFeedKey(firstFeed.key);
      if (group) {
        void analyticsService.logCategoryView(group.key, group.label, 'home_tab');
      }
    } else {
      void analyticsService.logCategoryView('all', 'รวมทุกหมวด', 'home_tab');
    }
  };

  const handleSourceSelect = (key: string) => {
    setSelectedFeedKey(key);
  };

  const handleLayoutToggle = () => {
    const next: CardLayoutOption =
      settings.cardLayout === 'compact'
        ? 'magazine'
        : settings.cardLayout === 'magazine'
        ? 'grid'
        : 'compact';
    setCardLayout(next);
  };

  const handleEndReached = () => {
    if (!isRefreshing && hasMore) {
      setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredArticles.length));
    }
  };

  const setCategoryLayout = (key: string, y: number) => {
    setCategoryLayouts((prev) => ({ ...prev, [key]: y }));
  };

  // Hero, highlights, and ticker derived data
  const heroArticles = useMemo(() => {
    const activeKeySet = new Set(feedGroups.map((g) => g.key));
    return homeSectionsService.getFeaturedHeroArticles(categorySections, activeKeySet);
  }, [categorySections, feedGroups]);

  const heroIds = useMemo(() => new Set(heroArticles.map((a) => a.id)), [heroArticles]);

  const highlightArticles = useMemo(() => {
    const activeKeySet = new Set(feedGroups.map((g) => g.key));
    return homeSectionsService.getTrendingHighlights(categorySections, heroIds, 6, activeKeySet);
  }, [categorySections, heroIds, feedGroups]);

  const tickerArticles = useMemo(() => {
    return homeSectionsService.getFlashTickerArticles(categorySections, 20);
  }, [categorySections]);

  const totalAllArticlesCount = useMemo(() => {
    return Object.values(categorySections).reduce((acc, list) => acc + list.length, 0);
  }, [categorySections]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const activeSources = activeGroup?.sources ?? [];
  const isHtmlFeed = selectedFeed.type === 'html';

  const isWaitingForLoading =
    !isHydrated ||
    (!articles.length && (isInitialLoading || isSwitchingFeed || isRefreshing));

  // Top Category Tabs including "รวมทุกหมวด"
  const categoryTabs: UnderlineTabItem[] = useMemo(() => {
    const allTab: UnderlineTabItem = {
      key: 'all',
      label: 'รวมทุกหมวด',
      iconName: 'view-dashboard-outline',
      color: '#0EA5E9',
    };
    const groupTabs: UnderlineTabItem[] = feedGroups.map((group) => {
      const cleanLabel = group.label.replace(/^ข่าว/, '');
      const icon = GROUP_ICONS[group.key] || 'newspaper';
      return {
        key: group.key,
        label: cleanLabel,
        iconName: icon,
        color: group.color,
      };
    });
    return [allTab, ...groupTabs];
  }, [feedGroups]);

  return {
    colors,
    scale,
    isDark,
    settings,
    activeGroupKey,
    activeGroup,
    feedGroups,
    categoryTabs,
    selectedFeed,
    selectedFeedKey,
    activeSources,
    isHtmlFeed,
    articles,
    filteredArticles,
    visibleArticles,
    visibleCount,
    hasMore,
    newArticlesCount,
    readArticlesCount,
    bookmarks,
    lastRefreshNewCount,
    lastUpdated,
    isShowingCachedFeed,
    statusFilter,
    setStatusFilter,
    categorySections,
    isSectionsLoading,
    loadProgress,
    loadingStageText,
    heroArticles,
    highlightArticles,
    tickerArticles,
    totalAllArticlesCount,
    homeScrollRef,
    isRefreshing,
    isInitialLoading,
    isSwitchingFeed,
    isWaitingForLoading,
    hasFetchError,
    handleRefreshAll,
    handlePressArticle,
    handleViewAllCategory,
    handleSelectCategoryQuickNav,
    handleCategoryTabChange,
    handleSourceSelect,
    handleLayoutToggle,
    handleEndReached,
    toggleBookmark,
    markAllAsRead,
    clearFreshCount,
    setCategoryLayout,
  };
}
