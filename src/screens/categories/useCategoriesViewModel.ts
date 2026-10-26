import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategoryVisual } from '../../config/categoryVisuals';
import { analyticsService } from '../../services/analyticsService';
import { useNews } from '../../store/NewsContext';
import { RootStackParamList } from '../../types';
import { CategoriesViewModel, CategoryGroupWithStats } from './types';

export function useCategoriesViewModel(): CategoriesViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    feedGroups,
    colors,
    scale,
    isDark,
    refresh,
    isRefreshing,
    channelStats,
  } = useNews();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    void analyticsService.logScreenView('หมวดหมู่ข่าวสารทั้งหมด', 'CategoriesScreen', {
      page_title: 'หมวดหมู่ข่าวสารทั้งหมด',
    });
  }, []);

  const groupsWithStats = useMemo<CategoryGroupWithStats[]>(() => {
    return feedGroups.map((group) => {
      const visual = getCategoryVisual(group.key, group.label, group.color);
      const regularSources = group.sources.filter((s) => s.type !== 'aggregate');

      let newCount = 0;
      let totalArticles = 0;
      for (const source of group.sources) {
        const stat = channelStats[source.key];
        if (stat) {
          totalArticles += stat.total;
          newCount += stat.newCount;
        }
      }

      return {
        ...group,
        visual,
        sourceCount: regularSources.length,
        totalArticles: Math.max(totalArticles, regularSources.length * 5),
        newCount,
      };
    });
  }, [feedGroups, channelStats]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupsWithStats;
    return groupsWithStats.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.visual.shortLabel.toLowerCase().includes(q) ||
        g.visual.tagline.toLowerCase().includes(q) ||
        g.sources.some((s) => s.label.toLowerCase().includes(q)),
    );
  }, [groupsWithStats, searchQuery]);

  const handleCategoryPress = useCallback(
    (item: CategoryGroupWithStats) => {
      void analyticsService.logCategoryView(item.key, item.label, 'categories_grid');
      navigation.navigate('CategoryDetail', { groupKey: item.key });
    },
    [navigation],
  );

  const handleRefresh = useCallback(() => {
    void refresh(true);
  }, [refresh]);

  return {
    filteredGroups,
    searchQuery,
    setSearchQuery,
    isRefreshing,
    handleRefresh,
    handleCategoryPress,
    colors,
    scale,
    isDark,
    insets,
  };
}
