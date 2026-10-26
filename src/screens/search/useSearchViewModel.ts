import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNews } from '../../store/NewsContext';
import { NewsArticle, RootStackParamList } from '../../types';
import { analyticsService } from '../../services/analyticsService';
import { showInterstitialAndNavigate } from '../../services/interstitialService';
import { SearchViewModel } from './types';

export function useSearchViewModel(): SearchViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    articles,
    bookmarks,
    searchHistory,
    colors,
    scale,
    settings,
    toggleBookmark,
    addSearchHistory,
    clearSearchHistory,
  } = useNews();

  const [query, setQuery] = useState('');

  useEffect(() => {
    void analyticsService.logScreenView('ค้นหาข่าวสาร', 'SearchScreen', {
      page_title: 'ค้นหาข่าวสาร',
    });
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('th');
    if (!term) return [];
    return articles.filter((item) =>
      [item.title, item.description, item.author ?? ''].some((value) =>
        value.toLocaleLowerCase('th').includes(term),
      ),
    );
  }, [articles, query]);

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      addSearchHistory(query);
      void analyticsService.logSearch(query);
    }
  }, [addSearchHistory, query]);

  const handleArticlePress = useCallback(
    (item: NewsArticle) => {
      if (query.trim()) {
        addSearchHistory(query);
      }
      void showInterstitialAndNavigate(() => {
        navigation.navigate('Article', {
          articleId: item.id,
          article: item,
          articles: results,
        });
      });
    },
    [addSearchHistory, navigation, query, results],
  );

  const handleHistoryPress = useCallback((term: string) => {
    setQuery(term);
  }, []);

  return {
    query,
    setQuery,
    results,
    searchHistory,
    colors,
    scale,
    settings,
    bookmarks,
    insets,
    handleArticlePress,
    handleHistoryPress,
    handleSearchSubmit,
    handleClearSearchHistory: clearSearchHistory,
    toggleBookmark,
  };
}
