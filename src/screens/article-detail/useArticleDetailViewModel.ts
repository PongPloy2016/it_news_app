import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { articleRepository } from '../../data/database/articles';
import { feedService } from '../../services/feedService';
import { useNews } from '../../store/NewsContext';
import { NewsArticle, RootStackParamList } from '../../types';
import { ArticleCategoryInfo, ArticleDetailViewModel } from './types';

interface UseArticleDetailViewModelProps {
  route: RouteProp<RootStackParamList, 'Article'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Article'>;
}

export function useArticleDetailViewModel({
  route,
  navigation,
}: UseArticleDetailViewModelProps): ArticleDetailViewModel {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const heroHeight = Math.round(Math.max(380, Math.min(450, screenHeight * 0.44)));

  const {
    articles,
    bookmarks,
    colors,
    scale,
    isDark,
    selectedFeed,
    feedGroups,
  } = useNews();

  const [fallbackArticle, setFallbackArticle] = useState<NewsArticle | undefined>(route.params.article);

  const initialArticle =
    route.params.article ??
    fallbackArticle ??
    articles.find((item) => item.id === route.params.articleId) ??
    bookmarks[route.params.articleId] ??
    feedService.getArticleById(route.params.articleId);

  useEffect(() => {
    if (!initialArticle) {
      void articleRepository.getCachedArticles().then((list) => {
        const found = list.find((it) => it.id === route.params.articleId);
        if (found) {
          setFallbackArticle(found);
        }
      });
    }
  }, [initialArticle, route.params.articleId]);

  // Resolve which category this article belongs to
  const articleCategory: ArticleCategoryInfo = useMemo(() => {
    if (route.params.categoryKey && route.params.categoryLabel) {
      return { key: route.params.categoryKey, label: route.params.categoryLabel };
    }
    if (route.params.categoryKey) {
      const match = feedGroups.find((g) => g.key === route.params.categoryKey);
      if (match) return { key: match.key, label: match.label };
    }
    if (initialArticle?.author) {
      const author = initialArticle.author.toLowerCase();
      const match = feedGroups.find((g) =>
        g.sources.some(
          (s) =>
            author.includes(s.label.toLowerCase()) ||
            s.label.toLowerCase().includes(author),
        ),
      );
      if (match) return { key: match.key, label: match.label };
    }
    if (selectedFeed?.key) {
      const match = feedGroups.find((g) => g.sources.some((s) => s.key === selectedFeed.key));
      if (match) return { key: match.key, label: match.label };
    }
    return { key: 'general', label: selectedFeed?.label || 'ข่าวไอที' };
  }, [
    route.params.categoryKey,
    route.params.categoryLabel,
    initialArticle?.author,
    selectedFeed?.key,
    selectedFeed?.label,
    feedGroups,
  ]);

  // Resolved list of articles strictly divided by category
  const resolvedArticleList = useMemo(() => {
    let list: NewsArticle[] = [];
    if (route.params.articles && route.params.articles.length > 0) {
      list = [...route.params.articles];
    } else if (articles && articles.length > 0) {
      // If categoryKey is known, filter articles to this category
      if (articleCategory.key && articleCategory.key !== 'general') {
        const grp = feedGroups.find((g) => g.key === articleCategory.key);
        if (grp) {
          const grpLabels = grp.sources.map((s) => s.label.toLowerCase());
          const catFiltered = articles.filter((a) => {
            if (!a.author) return false;
            const aAuthor = a.author.toLowerCase();
            return grpLabels.some((lbl) => aAuthor.includes(lbl) || lbl.includes(aAuthor));
          });
          if (catFiltered.length > 0) {
            list = catFiltered;
          }
        }
      }
      if (list.length === 0) {
        list = [...articles];
      }
    } else if (initialArticle) {
      list = [initialArticle];
    }

    if (initialArticle) {
      const existingIdx = list.findIndex((a) => a.id === initialArticle.id);
      if (existingIdx >= 0) {
        list[existingIdx] = {
          ...list[existingIdx],
          ...initialArticle,
          imageUrl: initialArticle.imageUrl || list[existingIdx].imageUrl,
        };
      } else {
        list.unshift(initialArticle);
      }
    }
    return list;
  }, [
    route.params.articles,
    articles,
    initialArticle,
    articleCategory.key,
    feedGroups,
  ]);

  const initialIndex = useMemo(() => {
    if (!initialArticle) return 0;
    const idx = resolvedArticleList.findIndex((a) => a.id === initialArticle.id);
    return idx >= 0 ? idx : 0;
  }, [resolvedArticleList, initialArticle]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<NewsArticle> | null>(null);
  const hasUserNavigatedRef = useRef(false);

  useEffect(() => {
    if (!hasUserNavigatedRef.current && initialArticle) {
      const idx = resolvedArticleList.findIndex((a) => a.id === initialArticle.id);
      if (idx >= 0 && idx !== currentIndex) {
        setCurrentIndex(idx);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: idx, animated: false });
        }, 30);
      }
    }
  }, [resolvedArticleList, initialArticle, currentIndex]);

  // Image Viewer Modal State
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerImages, setViewerImages] = useState<string[]>([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  // Font scale multiplier
  const [fontScaleMultiplier, setFontScaleMultiplier] = useState(1.0);
  useEffect(() => {
    AsyncStorage.getItem('@it_news_detail_font_scale')
      .then((saved) => {
        if (saved) {
          const val = parseFloat(saved);
          if (!isNaN(val) && val >= 0.8 && val <= 1.5) {
            setFontScaleMultiplier(val);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Toast feedback
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (msg: string) => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
      setToastMessage(msg);
      Animated.timing(toastAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();

      toastTimeoutRef.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 240,
          useNativeDriver: true,
        }).start(() => {
          setToastMessage(null);
        });
      }, 2200);
    },
    [toastAnim],
  );

  // Onboarding Hint on First Mount
  useEffect(() => {
    if (resolvedArticleList.length > 1) {
      const timer = setTimeout(() => {
        showToast('💡 ปัดหน้าจอซ้าย-ขวา เพื่อเลื่อนอ่านข่าวอื่นๆ ในหมวดนี้');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resolvedArticleList.length, showToast]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const target = currentIndex - 1;
      hasUserNavigatedRef.current = true;
      setCurrentIndex(target);
      flatListRef.current?.scrollToIndex({ index: target, animated: true });
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < resolvedArticleList.length - 1) {
      const target = currentIndex + 1;
      hasUserNavigatedRef.current = true;
      setCurrentIndex(target);
      flatListRef.current?.scrollToIndex({ index: target, animated: true });
    }
  }, [currentIndex, resolvedArticleList.length]);

  const onMomentumScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / screenWidth);
      if (
        newIndex >= 0 &&
        newIndex < resolvedArticleList.length &&
        newIndex !== currentIndex
      ) {
        hasUserNavigatedRef.current = true;
        setCurrentIndex(newIndex);
      }
    },
    [currentIndex, resolvedArticleList.length, screenWidth],
  );

  const categoryShortTitle = articleCategory.label.replace(/^ข่าว/, '').trim().slice(0, 16);

  return {
    insets,
    screenWidth,
    screenHeight,
    heroHeight,
    colors,
    scale,
    isDark,
    initialArticle,
    articleCategory,
    resolvedArticleList,
    initialIndex,
    currentIndex,
    categoryShortTitle,
    flatListRef,
    hasUserNavigatedRef,
    viewerVisible,
    viewerImages,
    viewerInitialIndex,
    setViewerVisible,
    setViewerImages,
    setViewerInitialIndex,
    fontScaleMultiplier,
    setFontScaleMultiplier,
    toastAnim,
    toastMessage,
    showToast,
    handlePrev,
    handleNext,
    onMomentumScrollEnd,
    navigation,
  };
}
