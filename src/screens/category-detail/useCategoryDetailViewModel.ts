import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategoryVisual } from '../../config/categoryVisuals';
import { FeedSource } from '../../config/feeds';
import { analyticsService } from '../../services/analyticsService';
import { feedService } from '../../services/feedService';
import { imageService } from '../../services/imageService';
import { showInterstitialAndNavigate } from '../../services/interstitialService';
import { useNews } from '../../store/NewsContext';
import { NewsArticle, RootStackParamList } from '../../types';
import { CategoryDetailViewModel } from './types';

type ScreenRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;

export function useCategoryDetailViewModel(): CategoryDetailViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { groupKey } = route.params;

  const {
    feedGroups,
    colors,
    scale,
    isDark,
    bookmarks,
    toggleBookmark,
    setSelectedFeedKey,
    channelStats,
    settings,
  } = useNews();

  const currentGroup = useMemo(() => {
    return feedGroups.find((g) => g.key === groupKey) ?? feedGroups[0];
  }, [feedGroups, groupKey]);

  useEffect(() => {
    if (currentGroup) {
      void analyticsService.logCategoryView(currentGroup.key, currentGroup.label, 'category_detail');
      void analyticsService.logScreenView(
        `หมวดหมู่ - ${currentGroup.label}`,
        'CategoryDetailScreen',
        {
          category: currentGroup.label,
          category_id: currentGroup.key,
          page_title: `หมวดหมู่ - ${currentGroup.label}`,
        },
      );
    }
  }, [currentGroup?.key, currentGroup?.label]);

  const visual = useMemo(() => {
    return getCategoryVisual(currentGroup?.key ?? groupKey, currentGroup?.label, currentGroup?.color);
  }, [currentGroup, groupKey]);

  const sources = useMemo(() => {
    return currentGroup?.sources ?? [];
  }, [currentGroup]);

  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('all');
  const [categoryArticles, setCategoryArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadArticles = useCallback(
    async (sourceKey: string) => {
      if (!currentGroup) return;
      try {
        let targetSource: FeedSource | undefined;
        if (sourceKey === 'all') {
          targetSource = sources.find((s) => s.type === 'aggregate') || {
            key: `all:${currentGroup.key}`,
            label: `รวมข่าว${visual.shortLabel}`,
            url: `aggregate://${currentGroup.key}`,
            homepage: 'https://techthainews.app',
            type: 'aggregate',
          };
        } else {
          targetSource = sources.find((s) => s.key === sourceKey);
        }

        if (targetSource) {
          const fetched = await feedService.fetchFeed(targetSource, 1);
          setCategoryArticles(fetched);

          void imageService.enrichArticlesWithOgImage(fetched, (updated) => {
            setCategoryArticles(updated);
          });
        }
      } catch (err) {
        console.warn('[CategoryDetailScreen] Failed to load articles:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [currentGroup, sources, visual.shortLabel],
  );

  useEffect(() => {
    setIsLoading(true);
    void loadArticles(selectedSourceKey);
  }, [selectedSourceKey, loadArticles]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    void loadArticles(selectedSourceKey);
  }, [loadArticles, selectedSourceKey]);

  const handleOpenArticle = useCallback(
    (article: NewsArticle) => {
      feedService.registerArticles([article]);
      showInterstitialAndNavigate(() => {
        navigation.navigate('Article', {
          articleId: article.id,
          article,
          articles: categoryArticles,
          categoryKey: currentGroup?.key,
          categoryLabel: currentGroup?.label,
        });
      });
    },
    [categoryArticles, currentGroup?.key, currentGroup?.label, navigation],
  );

  const handleSelectSource = useCallback((key: string) => {
    setSelectedSourceKey(key);
  }, []);

  const handleSetMainFeedAndGoHome = useCallback(
    (source: FeedSource) => {
      setSelectedFeedKey(source.key);
      navigation.navigate('MainTabs', { screen: 'Latest' });
    },
    [navigation, setSelectedFeedKey],
  );

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const openSearch = useCallback(() => {
    navigation.navigate('MainTabs', { screen: 'Search' });
  }, [navigation]);

  return {
    currentGroup,
    visual,
    sources,
    selectedSourceKey,
    categoryArticles,
    isLoading,
    isRefreshing,
    colors,
    scale,
    isDark,
    insets,
    settings,
    bookmarks,
    channelStats,
    handleSelectSource,
    onRefresh,
    handleOpenArticle,
    handleSetMainFeedAndGoHome,
    toggleBookmark,
    goBack,
    openSearch,
  };
}
