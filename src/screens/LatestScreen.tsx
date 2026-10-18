import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { AdBanner } from '../components/AdBanner';
import { AdCard } from '../components/AdCard';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { HomeEditorialSkeleton, SkeletonFeed } from '../components/SkeletonCard';
import { CustomRefreshHeader } from '../components/CustomRefreshIndicator';
import { TopProgressBar, HomeLoadingProgressCard } from '../components/LoadingProgressBar';
import { UnderlineTabBar, UnderlineTabItem } from '../components/UnderlineTabBar';
import { FlashDispatchTicker } from '../components/home/FlashDispatchTicker';
import { HeroShowcase } from '../components/home/HeroShowcase';
import { CategoryQuickNav } from '../components/home/CategoryQuickNav';
import { CategorySectionBlock } from '../components/home/CategorySectionBlock';
import { articleRepository } from '../data/database/articles';
import { feedService } from '../services/feedService';
import { homeSectionsService } from '../services/homeSectionsService';
import { imageService } from '../services/imageService';
import { useNews } from '../store/NewsContext';
import { CardLayoutOption, NewsArticle, RootStackParamList } from '../types';
import { formatRelative } from '../utils/content';
import { showInterstitialAndNavigate } from '../services/interstitialService';
import { analyticsService } from '../services/analyticsService';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const GROUP_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  all: 'view-dashboard-outline',
  'tech-business': 'laptop',
  international: 'earth',
  'thai-news': 'newspaper',
  mobile: 'cellphone',
  'computer-games': 'gamepad-variant',
  'weather-forecast': 'weather-partly-cloudy',
  weather: 'weather-partly-cloudy',
  cybersecurity: 'shield-alert',
  agriculture: 'sprout',
  'ai-innovation': 'robot',
  'ev-vehicles': 'car-electric',
  'science-space': 'telescope',
  'fintech-crypto': 'bitcoin',
  'developer-coding': 'code-tags',
};

const PAGE_SIZE = 10;

export function LatestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read'>('all');

  const {
    feedGroups,
    articles,
    bookmarks,
    colors,
    scale,
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
    toggleBookmark,
    markAsRead,
    markAllAsRead,
    isArticleNew,
    isArticleRead,
    lastRefreshNewCount,
    clearFreshCount,
  } = useNews();

  // Active category tab key: 'all' (Home / รวมทุกหมวด) or group.key
  const [activeGroupKey, setActiveGroupKey] = useState<string>('all');

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

  // Category sections data for "รวมทุกหมวด"
  const [categorySections, setCategorySections] = useState<Record<string, NewsArticle[]>>({});
  const [isSectionsLoading, setIsSectionsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0.12);
  const [loadingStageText, setLoadingStageText] = useState('กำลังเชื่อมต่อแหล่งข่าว...');
  const [categoryLayouts, setCategoryLayouts] = useState<Record<string, number>>({});
  const homeScrollRef = useRef<ScrollView>(null);

  const activeGroup = useMemo(
    () => feedGroups.find((group) => group.key === activeGroupKey) ??
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
    setVisibleCount((current) => Math.min(Math.max(current, PAGE_SIZE), filteredArticles.length || PAGE_SIZE));
  }, [filteredArticles.length]);

  // Load category sections on mount (offline cache first, then fetch fresh)
  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const cached = await homeSectionsService.getCachedCategorySections();
        if (isMounted && Object.keys(cached).length > 0) {
          setCategorySections(cached);
          setIsSectionsLoading(false);
          setLoadProgress(0.85);
          setLoadingStageText('โหลดข้อมูลแคชเรียบร้อยแล้ว');
        } else if (isMounted && articles.length > 0) {
          // Instant warm start from preloaded articles if first launch
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
              if (isMounted && catArticles.length > 0) {
                setCategorySections((prev) => ({
                  ...prev,
                  [categoryKey]: catArticles,
                }));
                setIsSectionsLoading(false);
              }
            }
          );
          if (isMounted && Object.keys(fresh).length > 0) {
            setCategorySections(fresh);
            setLoadProgress(1);
            setLoadingStageText('โหลดข้อมูลข่าวสารครบถ้วนแล้ว');
          }
        }
      } catch (err) {
        console.warn('[LatestScreen] Category sections load error:', err);
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
  const enrichedHomeIdsRef = useRef<Set<string>>(new Set());
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

  // Synchronize active group when selectedFeedKey changes externally (e.g. from drawer)
  useEffect(() => {
    const matchedGroup = feedGroups.find((group) => group.sources.some((item) => item.key === selectedFeedKey));
    if (matchedGroup && activeGroupKey !== 'all' && activeGroupKey !== matchedGroup.key) {
      setActiveGroupKey(matchedGroup.key);
    }
  }, [feedGroups, selectedFeedKey, activeGroupKey]);

  // Handle waiting loading when entering the screen (Instant Cache First)
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isSwitchingFeed, setIsSwitchingFeed] = useState(false);
  const prevFeedKeyRef = useRef(selectedFeedKey);

  useEffect(() => {
    if (articles.length > 0 || Object.keys(categorySections).length > 0) {
      setIsInitialLoading(false);
      setIsSwitchingFeed(false);
    }
  }, [articles.length, categorySections]);

  useEffect(() => {
    if (prevFeedKeyRef.current !== selectedFeedKey) {
      prevFeedKeyRef.current = selectedFeedKey;
      // Only set switching wait if there are no cached articles for this feed yet
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
              if (catArticles.length > 0) {
                setCategorySections((prev) => ({
                  ...prev,
                  [categoryKey]: catArticles,
                }));
              }
            },
          );
          // Preserve previously known article images
          setCategorySections((prev) => {
            const prevKnown = new Map(
              Object.values(prev)
                .flat()
                .filter((a) => a.imageUrl)
                .map((a) => [a.id, a.imageUrl]),
            );
            const preserved: Record<string, NewsArticle[]> = {};
            for (const [k, list] of Object.entries(fresh)) {
              preserved[k] = list.map((a) => ({
                ...a,
                imageUrl: a.imageUrl ?? prevKnown.get(a.id),
              }));
            }
            void articleRepository.saveCachedCategoryArticles(preserved);
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

      // 1. If not provided, find which group in categorySections contains this article
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

      // 2. If still not found, check if currently on a specific category tab
      if (!targetArticles || targetArticles.length === 0) {
        if (activeGroupKey !== 'all' && activeGroup) {
          targetArticles = filteredArticles;
          resolvedCatKey = activeGroup.key;
          resolvedCatLabel = activeGroup.label;
        } else {
          // If on 'all' view, match article's author with feedGroups
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

      // 3. Fallback to current filtered articles if no category-specific list found
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

  // Hero, highlights, and ticker derived data
  const heroArticles = useMemo(() => {
    return homeSectionsService.getFeaturedHeroArticles(categorySections);
  }, [categorySections]);

  const heroIds = useMemo(() => new Set(heroArticles.map((a) => a.id)), [heroArticles]);

  const highlightArticles = useMemo(() => {
    return homeSectionsService.getTrendingHighlights(categorySections, heroIds, 4);
  }, [categorySections, heroIds]);

  const tickerArticles = useMemo(() => {
    return homeSectionsService.getFlashTickerArticles(categorySections, 20);
  }, [categorySections]);

  const totalAllArticlesCount = useMemo(() => {
    return Object.values(categorySections).reduce((acc, list) => acc + list.length, 0);
  }, [categorySections]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const activeSources = activeGroup?.sources ?? [];

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

  const renderCategoryTabBar = () => (
    <UnderlineTabBar
      scrollable
      tabs={categoryTabs}
      activeKey={activeGroupKey}
      onChange={(key) => {
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
      }}
      indicatorColor={
        activeGroupKey === 'all'
          ? '#0EA5E9'
          : activeGroup?.color ?? '#2F6FED'
      }
      style={styles.mainTabBarWrap}
    />
  );

  const renderSourceTabBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.subTabBar}
      style={styles.subTabBarWrap}
    >
      {activeSources.map((feed) => {
        const active = feed.key === selectedFeedKey;
        const isAggregate = feed.type === 'aggregate';
        const groupColor = activeGroup?.color ?? '#2F6FED';
        return (
          <Pressable
            key={feed.key}
            onPress={() => setSelectedFeedKey(feed.key)}
            style={[
              styles.subTabItem,
              {
                backgroundColor: active
                  ? groupColor
                  : isAggregate
                  ? withAlpha(groupColor, 0.12)
                  : colors.surface,
                borderColor: active
                  ? groupColor
                  : isAggregate
                  ? withAlpha(groupColor, 0.4)
                  : colors.border,
              },
            ]}
          >
            {isAggregate && (
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={13 * scale}
                color={active ? '#FFFFFF' : groupColor}
                style={{ marginRight: 3 }}
              />
            )}
            <Text
              style={[
                styles.subTabLabel,
                {
                  color: active ? '#FFFFFF' : isAggregate ? groupColor : colors.text,
                  fontSize: 11.5 * scale,
                  fontWeight: active || isAggregate ? '700' : '500',
                },
              ]}
            >
              {feed.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderStatusFilterBar = () => (
    <View style={styles.statusFilterBar}>
      <Pressable
        onPress={() => setStatusFilter('all')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'all' ? colors.primary : colors.surfaceVariant,
            borderColor: statusFilter === 'all' ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'all' ? '#FFFFFF' : colors.text,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'all' ? '800' : '600',
            },
          ]}
        >
          ทั้งหมด ({articles.length})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setStatusFilter('new')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'new' ? '#EF4444' : colors.surfaceVariant,
            borderColor: statusFilter === 'new' ? '#EF4444' : newArticlesCount > 0 ? withAlpha('#EF4444', 0.5) : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="fire"
          size={13 * scale}
          color={statusFilter === 'new' ? '#FFFFFF' : '#EF4444'}
        />
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'new' ? '#FFFFFF' : colors.text,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'new' ? '800' : '600',
            },
          ]}
        >
          ข่าวใหม่ ({newArticlesCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setStatusFilter('read')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'read' ? colors.muted : colors.surfaceVariant,
            borderColor: statusFilter === 'read' ? colors.muted : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="check"
          size={13 * scale}
          color={statusFilter === 'read' ? '#FFFFFF' : colors.muted}
        />
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'read' ? '#FFFFFF' : colors.muted,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'read' ? '800' : '600',
            },
          ]}
        >
          อ่านแล้ว ({readArticlesCount})
        </Text>
      </Pressable>
    </View>
  );

  // =========================================================================
  // VIEW 1: "หน้าแรก (รวมทุกหมวด)" (All Categories Editorial Homepage)
  // =========================================================================
  if (activeGroupKey === 'all') {
    if (isSectionsLoading && Object.keys(categorySections).length === 0) {
      return (
        <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
          {/* Top slim animated progress bar */}
          <TopProgressBar progress={loadProgress} visible={true} color="#0EA5E9" />
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
          >
            {/* Top Category Tab Bar with "รวมทุกหมวด" active */}
            {renderCategoryTabBar()}

            {/* Loading Process Card with % and stage status */}
            <HomeLoadingProgressCard
              progress={loadProgress}
              statusText={loadingStageText}
              color="#0EA5E9"
            />

            {/* Editorial Homepage Skeleton (Matches loaded UI 1:1) */}
            <HomeEditorialSkeleton />
          </ScrollView>
          <AdBanner style={[styles.bottomAdBanner, { backgroundColor: colors.surface, borderTopColor: colors.border }]} />
        </View>
      );
    }

    return (
      <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
        {/* Top slim animated progress bar during refresh */}
        <TopProgressBar progress={loadProgress} visible={isRefreshing} color="#0EA5E9" />
        <ScrollView
          ref={homeScrollRef}
          contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefreshAll(true)}
              tintColor="#0EA5E9"
              colors={['#0EA5E9']}
            />
          }
        >
          {/* Top Category Tab Bar with "รวมทุกหมวด" active */}
          {renderCategoryTabBar()}

          {/* Loading Process Card during pull-to-refresh */}
          {isRefreshing && (
            <HomeLoadingProgressCard
              progress={loadProgress}
              statusText={loadingStageText}
              color="#0EA5E9"
            />
          )}

          {/* Custom Refresh Indicator during pull-to-refresh */}
          <CustomRefreshHeader
            visible={isRefreshing}
            label="กำลังอัปเดตข่าวทุกหมวดหมู่..."
            color="#0EA5E9"
          />

          {/* 1. Flash Dispatch Ticker (ข่าวด่วนหมุนเวียน) */}
          <FlashDispatchTicker
            articles={tickerArticles}
            onPressArticle={handlePressArticle}
          />

          {/* 2. Hero Showcase Slider + Trending Highlights */}
          <HeroShowcase
            heroArticles={heroArticles}
            highlightArticles={highlightArticles}
            onPressArticle={handlePressArticle}
          />

          {/* 3. Quick Category Jump Bar (แถบทางลัดหมวดหมู่) */}
          <CategoryQuickNav
            groups={feedGroups}
            totalArticlesCount={totalAllArticlesCount}
            onSelectCategory={(groupKey) => {
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
            }}
          />

          {/* 4. Category Section Blocks (รวมทุกหมวดในหน้าเดียว) */}
          {feedGroups.map((group) => {
            const groupArticles = categorySections[group.key] || [];
            if (groupArticles.length === 0) return null;
            return (
              <View
                key={`cat-section-${group.key}`}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  setCategoryLayouts((prev) => ({ ...prev, [group.key]: y }));
                }}
              >
                <CategorySectionBlock
                  group={group}
                  articles={groupArticles}
                  onPressArticle={handlePressArticle}
                  onViewAll={handleViewAllCategory}
                />
              </View>
            );
          })}
        </ScrollView>
        <AdBanner style={[styles.bottomAdBanner, { backgroundColor: colors.surface, borderTopColor: colors.border }]} />
      </View>
    );
  }

  // =========================================================================
  // VIEW 2: INDIVIDUAL CATEGORY FEED
  // =========================================================================
  if (selectedFeed.type === 'html') {
    return (
      <View style={[styles.htmlScreen, { backgroundColor: colors.background }]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {renderCategoryTabBar()}
          {renderSourceTabBar()}
        </View>

        <View style={styles.webViewWrap}>
          <WebView
            source={{ uri: selectedFeed.url }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />
        </View>
      </View>
    );
  }

  const isWaitingForLoading =
    !isHydrated ||
    (!articles.length && (isInitialLoading || isSwitchingFeed || isRefreshing));

  if (isWaitingForLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Top slim progress bar for category view */}
        <TopProgressBar progress={0.65} visible={true} color={activeGroup?.color ?? colors.primary} />
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {renderCategoryTabBar()}
          {renderSourceTabBar()}
        </View>
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <HomeLoadingProgressCard
            progress={0.65}
            statusText={`กำลังโหลดข่าว${selectedFeed?.label ? ` ${selectedFeed.label}` : ''}...`}
            color={activeGroup?.color ?? colors.primary}
          />
        </View>
        <SkeletonFeed layout={settings.cardLayout} count={5} />
      </View>
    );
  }

  if (hasFetchError && !articles.length) {
    return (
      <ScreenState
        icon="cloud-alert-outline"
        title="โหลดข่าวไม่สำเร็จ"
        subtitle="ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง"
        actionLabel="ลองใหม่"
        onAction={() => void refresh()}
      />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      {/* Top slim progress bar during refresh */}
      <TopProgressBar progress={0.8} visible={isRefreshing} color={activeGroup?.color ?? colors.primary} />
      <FlatList
        key={settings.cardLayout === 'grid' ? 'grid-latest-2cols' : 'list-latest-1col'}
        numColumns={settings.cardLayout === 'grid' ? 2 : 1}
        columnWrapperStyle={settings.cardLayout === 'grid' ? styles.gridColumnWrap : undefined}
        data={visibleArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh(true)}
            tintColor={activeGroup?.color ?? colors.primary}
            colors={[activeGroup?.color ?? colors.primary]}
          />
        }
        onEndReached={() => {
          if (!isRefreshing && hasMore) {
            setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredArticles.length));
          }
        }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {renderCategoryTabBar()}
            {renderSourceTabBar()}

            {/* Custom Refresh Indicator Header during pull-to-refresh */}
            <CustomRefreshHeader
              visible={isRefreshing}
              label="กำลังอัปเดตข่าวล่าสุด..."
              color={activeGroup?.color}
            />

            {/* New Articles Banner on Refresh */}
            {lastRefreshNewCount > 0 && (
              <View style={[styles.newAlertBanner, { backgroundColor: withAlpha('#EF4444', 0.12), borderColor: '#EF4444' }]}>
                <View style={styles.newAlertTextWrap}>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color="#EF4444" />
                  <Text style={[styles.newAlertText, { color: colors.text, fontSize: 13 * scale }]}>
                    พบข่าวใหม่มาเพิ่ม{' '}
                    <Text style={{ fontWeight: '900', color: '#EF4444' }}>{lastRefreshNewCount}</Text> ข่าว!
                  </Text>
                </View>
                <View style={styles.newAlertActionWrap}>
                  <Pressable
                    onPress={() => {
                      setStatusFilter('new');
                      clearFreshCount();
                    }}
                    style={styles.newAlertBtn}
                  >
                    <Text style={styles.newAlertBtnText}>ดูข่าวใหม่</Text>
                  </Pressable>
                  <Pressable hitSlop={8} onPress={clearFreshCount} style={styles.newAlertCloseBtn}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.muted} />
                  </Pressable>
                </View>
              </View>
            )}

            {isShowingCachedFeed ? (
              <View style={[styles.banner, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.bannerText, { color: colors.muted, fontSize: 13 * scale }]}>
                  ออฟไลน์ — กำลังแสดงข่าวที่บันทึกไว้
                </Text>
              </View>
            ) : null}

            <View style={styles.headingRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.heading, { color: colors.text, fontSize: 21 * scale }]}>
                    {selectedFeed.label}
                  </Text>
                  {newArticlesCount > 0 && (
                    <View style={styles.newHeaderBadge}>
                      <Text style={styles.newHeaderBadgeText}>{newArticlesCount} ใหม่</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.updated, { color: colors.muted, fontSize: 12 * scale }]}>
                  {lastUpdated ? `อัปเดต ${formatRelative(lastUpdated)}` : 'ดึงลงเพื่อรีเฟรช'}
                </Text>
              </View>

              <View style={styles.headingActions}>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    const next: CardLayoutOption =
                      settings.cardLayout === 'compact'
                        ? 'magazine'
                        : settings.cardLayout === 'magazine'
                        ? 'grid'
                        : 'compact';
                    setCardLayout(next);
                  }}
                  style={[
                    styles.layoutToggleBtn,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  accessibilityLabel="เปลี่ยนรูปแบบการแสดงผล"
                >
                  <MaterialCommunityIcons
                    name={
                      settings.cardLayout === 'compact'
                        ? 'view-agenda-outline'
                        : settings.cardLayout === 'magazine'
                        ? 'view-grid-outline'
                        : 'view-headline'
                    }
                    size={19}
                    color={colors.primary}
                  />
                </Pressable>

                {newArticlesCount > 0 ? (
                  <Pressable
                    hitSlop={8}
                    onPress={markAllAsRead}
                    style={[styles.markAllReadBtn, { backgroundColor: withAlpha(colors.primary, 0.12) }]}
                  >
                    <MaterialCommunityIcons name="check-all" size={15} color={colors.primary} />
                    <Text style={[styles.markAllReadText, { color: colors.primary, fontSize: 11 * scale }]}>
                      อ่านหมด
                    </Text>
                  </Pressable>
                ) : (
                  <View style={[styles.countBadge, { backgroundColor: withAlpha(activeGroup?.color ?? '#2F6FED', 0.12) }]}>
                    <Text style={[styles.countText, { color: activeGroup?.color ?? '#2F6FED', fontSize: 13 * scale }]}>
                      {articles.length} ข่าว
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Filter Bar (ทั้งหมด / ข่าวใหม่ / อ่านแล้ว) */}
            {renderStatusFilterBar()}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name={statusFilter === 'new' ? 'check-circle-outline' : 'newspaper-variant-outline'}
              size={44}
              color={statusFilter === 'new' ? '#10B981' : colors.muted}
            />
            <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 15 * scale }]}>
              {statusFilter === 'new'
                ? 'คุณอ่านข่าวใหม่ครบทั้งหมดแล้ว!'
                : statusFilter === 'read'
                ? 'ยังไม่มีข่าวที่อ่านแล้ว'
                : 'ไม่พบข่าวในหมวดนี้'}
            </Text>
            {statusFilter !== 'all' && (
              <Pressable
                onPress={() => setStatusFilter('all')}
                style={[styles.emptyResetBtn, { backgroundColor: colors.surfaceVariant }]}
              >
                <Text style={[styles.emptyResetText, { color: colors.primary, fontSize: 13 * scale }]}>
                  ดูข่าวทั้งหมด
                </Text>
              </Pressable>
            )}
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={settings.cardLayout === 'grid' ? styles.gridItemWrapper : undefined}>
            <NewsCard
              article={item}
              isBookmarked={Boolean(bookmarks[item.id])}
              onToggleBookmark={() => toggleBookmark(item)}
              onPress={() =>
                handlePressArticle(
                  item,
                  filteredArticles,
                  activeGroup?.key,
                  activeGroup?.label,
                )
              }
            />
            {settings.cardLayout !== 'grid' && (index + 1) % 5 === 0 && (
              <AdCard style={styles.inFeedAdCard} />
            )}
          </View>
        )}
      />
      <AdBanner style={[styles.bottomAdBanner, { backgroundColor: colors.surface, borderTopColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  gridColumnWrap: {
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    flex: 1,
  },
  bottomAdBanner: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 2,
  },
  inFeedAdCard: {
    marginVertical: 10,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 14 },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 96 },
  headerSection: { marginBottom: 6 },
  htmlScreen: { flex: 1 },
  webViewWrap: { flex: 1, minHeight: 320 },
  webViewLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  mainTabBarWrap: { marginBottom: 10 },
  subTabBarWrap: { marginBottom: 12 },
  subTabBar: { gap: 6, paddingVertical: 2 },
  subTabItem: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  subTabLabel: {},
  banner: { borderRadius: 12, marginBottom: 10, padding: 10 },
  bannerText: { textAlign: 'center' },
  newAlertBanner: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newAlertTextWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  newAlertText: { fontWeight: '700' },
  newAlertActionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  newAlertBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  newAlertCloseBtn: { padding: 4 },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heading: { fontWeight: '900', letterSpacing: -0.3 },
  updated: { marginTop: 2 },
  headingActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  layoutToggleBtn: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 6,
  },
  markAllReadBtn: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  markAllReadText: { fontWeight: '800' },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: { fontWeight: '700' },
  statusFilterBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statusChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {},
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyResetBtn: {
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  emptyResetText: { fontWeight: '700' },
  footerLoader: { paddingVertical: 16 },
  newHeaderBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
