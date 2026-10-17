import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleDetailItem } from '../components/ArticleDetailItem';
import { ImageViewerModal } from '../components/ImageViewerModal';
import { ScreenState } from '../components/ScreenState';
import { articleRepository } from '../data/database/articles';
import { feedService } from '../services/feedService';
import { useNews } from '../store/NewsContext';
import { NewsArticle, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const heroHeight = Math.max(400, Math.min(480, screenHeight * 0.48));

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
  const articleCategory = useMemo(() => {
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

    if (initialArticle && !list.some((a) => a.id === initialArticle.id)) {
      list.unshift(initialArticle);
    }
    return list;
  }, [
    route.params.articles,
    articles,
    initialArticle?.id,
    articleCategory.key,
    feedGroups,
  ]);

  const initialIndex = useMemo(() => {
    if (!initialArticle) return 0;
    const idx = resolvedArticleList.findIndex((a) => a.id === initialArticle.id);
    return idx >= 0 ? idx : 0;
  }, [resolvedArticleList, initialArticle?.id]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const flatListRef = useRef<FlatList<NewsArticle>>(null);
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
  }, [resolvedArticleList, initialArticle?.id]);

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
  }, [resolvedArticleList.length]);

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

  if (!initialArticle) {
    return (
      <ScreenState
        icon="newspaper-remove"
        title="ไม่พบข่าวนี้"
        subtitle="ข่าวอาจถูกลบออกจากแคชแล้ว ลองกลับไปหน้ารายการและเปิดใหม่อีกครั้ง"
      />
    );
  }

  const categoryShortTitle = articleCategory.label.replace(/^ข่าว/, '').trim().slice(0, 16);

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* 1. Native Horizontal Pager FlatList (Smooth 120fps Real-Time Finger Sliding) */}
      <FlatList
        ref={flatListRef}
        data={resolvedArticleList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        initialScrollIndex={
          initialIndex >= 0 && initialIndex < resolvedArticleList.length
            ? initialIndex
            : 0
        }
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 40);
        }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        windowSize={3}
        maxToRenderPerBatch={1}
        initialNumToRender={1}
        removeClippedSubviews={Platform.OS === 'android'}
        renderItem={({ item, index }) => (
          <View style={{ width: screenWidth, height: '100%' }}>
            <ArticleDetailItem
              article={item}
              isActive={index === currentIndex}
              navigation={navigation}
              insets={insets}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
              heroHeight={heroHeight}
              articleCategory={articleCategory}
              fontScaleMultiplier={fontScaleMultiplier}
              setFontScaleMultiplier={setFontScaleMultiplier}
              onOpenViewer={(images, idx) => {
                setViewerImages(images);
                setViewerInitialIndex(idx);
                setViewerVisible(true);
              }}
              onNextArticlePress={handleNext}
              onSelectRelatedArticle={(targetArticle) => {
                const targetIdx = resolvedArticleList.findIndex((a) => a.id === targetArticle.id);
                if (targetIdx >= 0) {
                  hasUserNavigatedRef.current = true;
                  setCurrentIndex(targetIdx);
                  flatListRef.current?.scrollToIndex({ index: targetIdx, animated: true });
                } else {
                  navigation.push('Article', {
                    articleId: targetArticle.id,
                    articles: resolvedArticleList,
                    categoryKey: articleCategory.key,
                    categoryLabel: articleCategory.label,
                  });
                }
              }}
              showToast={showToast}
            />
          </View>
        )}
      />

      {/* 2. Floating Bottom Quick Slide Navigator */}
      {resolvedArticleList.length > 1 && (
        <View
          style={[styles.floatingSlideBarWrap, { bottom: insets.bottom + 12 }]}
          pointerEvents="box-none"
        >
          <View
            style={[
              styles.floatingSlideBar,
              {
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Prev Button */}
            <Pressable
              hitSlop={8}
              disabled={currentIndex === 0}
              onPress={handlePrev}
              style={({ pressed }) => [
                styles.slideNavBtn,
                currentIndex === 0 && styles.slideNavBtnDisabled,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityLabel="ข่าวก่อนหน้า"
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={22}
                color={currentIndex === 0 ? (isDark ? '#475569' : '#CBD5E1') : colors.primary}
              />
              <Text
                style={[
                  styles.slideNavBtnText,
                  {
                    color: currentIndex === 0 ? (isDark ? '#475569' : '#CBD5E1') : colors.primary,
                    fontSize: 12 * scale,
                  },
                ]}
              >
                ก่อนหน้า
              </Text>
            </Pressable>

            <View
              style={[
                styles.slideDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
              ]}
            />

            {/* Center Info with Category & Index */}
            <View style={styles.slideCenterInfo}>
              <View style={styles.slideCounterRow}>
                <MaterialCommunityIcons name="swap-horizontal" size={13} color={colors.primary} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.slideCategoryText,
                    { color: colors.primary, fontSize: 10.5 * scale },
                  ]}
                >
                  {categoryShortTitle}
                </Text>
                <Text style={[styles.slideCounterText, { color: colors.text, fontSize: 11 * scale }]}>
                  ({currentIndex + 1}/{resolvedArticleList.length})
                </Text>
              </View>
              <Text style={[styles.slideHintText, { color: colors.muted, fontSize: 9 * scale }]}>
                ปัดซ้าย-ขวา
              </Text>
            </View>

            <View
              style={[
                styles.slideDivider,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
              ]}
            />

            {/* Next Button */}
            <Pressable
              hitSlop={8}
              disabled={currentIndex === resolvedArticleList.length - 1}
              onPress={handleNext}
              style={({ pressed }) => [
                styles.slideNavBtn,
                currentIndex === resolvedArticleList.length - 1 && styles.slideNavBtnDisabled,
                pressed && { opacity: 0.6 },
              ]}
              accessibilityLabel="ข่าวถัดไป"
            >
              <Text
                style={[
                  styles.slideNavBtnText,
                  {
                    color:
                      currentIndex === resolvedArticleList.length - 1
                        ? isDark
                          ? '#475569'
                          : '#CBD5E1'
                        : colors.primary,
                    fontSize: 12 * scale,
                  },
                ]}
              >
                ถัดไป
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={
                  currentIndex === resolvedArticleList.length - 1
                    ? isDark
                      ? '#475569'
                      : '#CBD5E1'
                    : colors.primary
                }
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* 3. Full Screen Image Viewer Modal */}
      {viewerImages.length > 0 && (
        <ImageViewerModal
          visible={viewerVisible}
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          onIndexChange={(newIdx) => setViewerInitialIndex(newIdx)}
          onClose={() => setViewerVisible(false)}
        />
      )}

      {/* 4. Animated Toast Feedback */}
      {toastMessage && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              bottom: insets.bottom + 76,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <MaterialCommunityIcons name="information" size={17} color="#60A5FA" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  /* Floating Bottom Quick Slide Navigator */
  floatingSlideBarWrap: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 90,
  },
  floatingSlideBar: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  slideNavBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  slideNavBtnDisabled: {
    opacity: 0.35,
  },
  slideNavBtnText: {
    fontWeight: '700',
  },
  slideDivider: {
    height: 18,
    width: StyleSheet.hairlineWidth,
  },
  slideCenterInfo: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  slideCategoryText: {
    fontWeight: '700',
  },
  slideCounterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  slideCounterText: {
    fontWeight: '800',
  },
  slideHintText: {
    fontWeight: '500',
  },
  /* Toast Notification */
  toastContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.94)',
    borderRadius: 24,
    elevation: 6,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    zIndex: 150,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
});
