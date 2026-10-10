import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner } from '../components/AdBanner';
import { AdCard } from '../components/AdCard';
import { AiReaderCard } from '../components/AiReaderCard';
import { ArticleVideoPlayer } from '../components/ArticleVideoPlayer';
import { ImageViewerModal } from '../components/ImageViewerModal';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { articleRepository } from '../data/database/articles';
import { feedService } from '../services/feedService';
import { imageService } from '../services/imageService';
import { showInterstitialAndNavigate } from '../services/interstitialService';
import { useNews } from '../store/NewsContext';
import { typography } from '../theme';
import { NewsArticle, RootStackParamList } from '../types';
import { cleanNewsContent, generateAiSummary } from '../utils/aiSummary';
import { formatRelative, sanitizeImageUrl, stripHtml } from '../utils/content';
import { shareArticle } from '../utils/share';
import { SpeechRate, speakArticleText, stopSpeaking } from '../utils/speech';

type ReactionType = 'helpful' | 'hot' | 'insightful' | 'tech';

const REACTIONS_LIST: Array<{
  key: ReactionType;
  emoji: string;
  label: string;
}> = [
  { key: 'helpful', emoji: '👍', label: 'มีประโยชน์' },
  { key: 'hot', emoji: '🔥', label: 'ร้อนแรง' },
  { key: 'insightful', emoji: '💡', label: 'ได้ความรู้' },
  { key: 'tech', emoji: '⚡', label: 'ล้ำสมัย' },
];

function getBaseReactionCounts(id: string): Record<ReactionType, number> {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  const abs = Math.abs(hash);
  return {
    helpful: (abs % 28) + 6,
    hot: ((abs >> 3) % 22) + 4,
    insightful: ((abs >> 6) % 18) + 3,
    tech: ((abs >> 9) % 25) + 5,
  };
}

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
    toggleBookmark,
    isDark,
    settings,
    remoteSettings,
    selectedFeed,
    markAsRead,
  } = useNews();

  const isAiEnabled = settings.aiReaderEnabled && remoteSettings.is_ai_enabled;
  const [readerMode, setReaderMode] = useState<'ai' | 'full'>(isAiEnabled ? 'ai' : 'full');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState<SpeechRate>(0.9);

  const [fallbackArticle, setFallbackArticle] = useState<NewsArticle | undefined>(route.params.article);

  const article =
    route.params.article ??
    fallbackArticle ??
    articles.find((item) => item.id === route.params.articleId) ??
    bookmarks[route.params.articleId] ??
    feedService.getArticleById(route.params.articleId);

  useEffect(() => {
    if (!article) {
      void articleRepository.getCachedArticles().then((list) => {
        const found = list.find((it) => it.id === route.params.articleId);
        if (found) {
          setFallbackArticle(found);
        }
      });
    }
  }, [article, route.params.articleId]);

  // Stop speaking when leaving the screen
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const aiSummary = useMemo(() => {
    if (!article) return null;
    return generateAiSummary(article.title, article.content || article.description);
  }, [article]);

  const isDescDuplicate = useMemo(() => {
    if (!article?.description || !article?.title) return true;
    const cleanT = article.title.trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
    const cleanD = stripHtml(article.description).trim().toLowerCase().replace(/[^a-z0-9ก-๙]/g, '');
    return cleanD.length === 0 || cleanD === cleanT || cleanT.startsWith(cleanD) || cleanD.startsWith(cleanT.slice(0, 25));
  }, [article?.title, article?.description]);

  const otherArticles = useMemo(() => {
    if (!article) return [];
    const limit = remoteSettings.related_news_limit ?? 10;
    return articles.filter((item) => item.id !== article.id).slice(0, limit);
  }, [articles, article, remoteSettings.related_news_limit]);

  const nextArticle = otherArticles.length > 0 ? otherArticles[0] : null;
  const remainingRelated = useMemo(() => {
    return otherArticles.length > 1 ? otherArticles.slice(1) : [];
  }, [otherArticles]);

  // Main Scroll, Sticky Header & Reading Progress
  const mainScrollRef = useRef<ScrollView>(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);
  const scrollProgressRef = useRef(0);

  // Animated controllers
  const stickyHeaderAnim = useRef(new Animated.Value(0)).current;
  const scrollTopAnim = useRef(new Animated.Value(0)).current;
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Quick Font Sizer Multiplier (Persisted across sessions)
  const [fontScaleMultiplier, setFontScaleMultiplier] = useState(1.0);

  // News Reactions State (Persisted per article)
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<ReactionType, number>>({
    helpful: 0,
    hot: 0,
    insightful: 0,
    tech: 0,
  });

  // Sticky header transition
  useEffect(() => {
    Animated.timing(stickyHeaderAnim, {
      toValue: isScrolledPastHero ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isScrolledPastHero, stickyHeaderAnim]);

  // Scroll to top FAB transition
  useEffect(() => {
    Animated.spring(scrollTopAnim, {
      toValue: showScrollTop ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 40,
    }).start();
  }, [showScrollTop, scrollTopAnim]);

  // Load font scale preference
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

  // Load reactions for this article
  useEffect(() => {
    if (!article) return;
    const base = getBaseReactionCounts(article.id);
    setReactionCounts(base);

    const storageKey = `@it_news_reaction_${article.id}`;
    AsyncStorage.getItem(storageKey)
      .then((saved) => {
        if (
          saved &&
          (saved === 'helpful' || saved === 'hot' || saved === 'insightful' || saved === 'tech')
        ) {
          const rx = saved as ReactionType;
          setUserReaction(rx);
          setReactionCounts((prev) => ({
            ...prev,
            [rx]: prev[rx] + 1,
          }));
        }
      })
      .catch(() => {});
  }, [article?.id]);

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

  const adjustFontScale = (delta: number) => {
    setFontScaleMultiplier((prev) => {
      const next = Math.round(Math.min(1.35, Math.max(0.85, prev + delta)) * 100) / 100;
      AsyncStorage.setItem('@it_news_detail_font_scale', String(next)).catch(() => {});
      return next;
    });
  };

  const resetFontScale = () => {
    setFontScaleMultiplier(1.0);
    AsyncStorage.setItem('@it_news_detail_font_scale', '1.0').catch(() => {});
  };

  const handleToggleReaction = (type: ReactionType) => {
    if (!article) return;
    const storageKey = `@it_news_reaction_${article.id}`;

    if (userReaction === type) {
      setUserReaction(null);
      setReactionCounts((prev) => ({
        ...prev,
        [type]: Math.max(0, prev[type] - 1),
      }));
      AsyncStorage.removeItem(storageKey).catch(() => {});
    } else {
      const prevType = userReaction;
      setUserReaction(type);
      setReactionCounts((prev) => {
        const updated = { ...prev };
        if (prevType) {
          updated[prevType] = Math.max(0, updated[prevType] - 1);
        }
        updated[type] = updated[type] + 1;
        return updated;
      });
      AsyncStorage.setItem(storageKey, type).catch(() => {});
    }
  };

  const handleScrollToTop = () => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const onMainScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const currentY = contentOffset.y;

      const pastHero = currentY > heroHeight - insets.top - 20;
      setIsScrolledPastHero((prev) => (prev !== pastHero ? pastHero : prev));

      const pastFab = currentY > 400;
      setShowScrollTop((prev) => (prev !== pastFab ? pastFab : prev));

      const maxScroll = contentSize.height - layoutMeasurement.height;
      if (maxScroll > 0) {
        const rawProgress = Math.min(1, Math.max(0, currentY / maxScroll));
        if (
          Math.abs(rawProgress - scrollProgressRef.current) >= 0.012 ||
          rawProgress === 1 ||
          rawProgress === 0
        ) {
          scrollProgressRef.current = rawProgress;
          setReadingProgress(rawProgress);
        }
      }
    },
    [heroHeight, insets.top],
  );

  const [imageError, setImageError] = useState(false);
  const displayImageUrl = !imageError ? sanitizeImageUrl(article?.imageUrl) : undefined;
  const [detailImages, setDetailImages] = useState<string[] | undefined>(
    article?.images && article.images.length > 0 ? article.images : undefined,
  );
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);

  useEffect(() => {
    if (!article) return;
    if (article.images && article.images.length > 1) {
      setDetailImages(article.images);
      return;
    }

    let isMounted = true;
    void imageService.fetchArticleImagesFromLink(article.link).then((fetchedImages) => {
      if (isMounted && fetchedImages.length > 0) {
        setDetailImages(fetchedImages);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [article?.id, article?.link]);

  if (!article || !aiSummary) {
    return (
      <ScreenState
        icon="newspaper-remove"
        title="ไม่พบข่าวนี้"
        subtitle="ข่าวอาจถูกลบออกจากแคชแล้ว ลองกลับไปหน้ารายการและเปิดใหม่อีกครั้ง"
      />
    );
  }

  const bookmarked = Boolean(bookmarks[article.id]);

  const handleToggleVoice = (newRate?: SpeechRate) => {
    const rateToUse = newRate ?? speechRate;
    if (isVoicePlaying && !newRate) {
      stopSpeaking();
      setIsVoicePlaying(false);
    } else {
      setIsVoicePlaying(true);
      const textToRead =
        readerMode === 'full'
          ? `${article.title}. ${cleanNewsContent(article.content || article.description || '')}`
          : aiSummary.speechScript;

      speakArticleText(textToRead, {
        rate: rateToUse,
        onDone: () => setIsVoicePlaying(false),
        onStopped: () => setIsVoicePlaying(false),
        onError: () => setIsVoicePlaying(false),
      });
    }
  };

  const handleChangeRate = (rate: SpeechRate) => {
    setSpeechRate(rate);
    if (isVoicePlaying) {
      handleToggleVoice(rate);
    }
  };

  const galleryImages = useMemo(
    () =>
      [
        ...(displayImageUrl ? [displayImageUrl] : []),
        ...(detailImages || []),
      ].filter((url, idx, self) => url && typeof url === 'string' && self.indexOf(url) === idx),
    [displayImageUrl, detailImages],
  );

  const [heroActiveIndex, setHeroActiveIndex] = useState(0);
  const [heroFailedIndices, setHeroFailedIndices] = useState<Record<number, boolean>>({});
  const heroScrollRef = useRef<ScrollView>(null);
  const isUserInteractingRef = useRef(false);
  const heroIndexRef = useRef(0);
  const autoSlideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interactionResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync ref with state
  heroIndexRef.current = heroActiveIndex;

  // Auto-slide function
  const startAutoSlide = useCallback(() => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
    if (galleryImages.length <= 1 || viewerVisible) return;

    autoSlideTimerRef.current = setInterval(() => {
      if (isUserInteractingRef.current || viewerVisible) return;
      const nextIdx = (heroIndexRef.current + 1) % galleryImages.length;
      heroIndexRef.current = nextIdx;
      setHeroActiveIndex(nextIdx);
      heroScrollRef.current?.scrollTo({
        x: nextIdx * screenWidth,
        animated: true,
      });
    }, 3800);
  }, [galleryImages.length, screenWidth, viewerVisible]);

  // Start / restart auto-slide when images or viewer visibility changes
  useEffect(() => {
    startAutoSlide();

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
      if (interactionResumeTimerRef.current) {
        clearTimeout(interactionResumeTimerRef.current);
        interactionResumeTimerRef.current = null;
      }
    };
  }, [startAutoSlide]);

  // Keep scroll aligned on screen dimension change
  useEffect(() => {
    if (galleryImages.length > 1) {
      heroScrollRef.current?.scrollTo({
        x: heroIndexRef.current * screenWidth,
        animated: false,
      });
    }
  }, [screenWidth, galleryImages.length]);

  const onHeroScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / screenWidth);
      if (nextIndex >= 0 && nextIndex < galleryImages.length && nextIndex !== heroActiveIndex) {
        setHeroActiveIndex(nextIndex);
        heroIndexRef.current = nextIndex;
      }
    },
    [galleryImages.length, heroActiveIndex, screenWidth],
  );

  const onHeroScrollBeginDrag = useCallback(() => {
    isUserInteractingRef.current = true;
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
      autoSlideTimerRef.current = null;
    }
  }, []);

  const onHeroScrollEndDrag = useCallback(() => {
    if (interactionResumeTimerRef.current) {
      clearTimeout(interactionResumeTimerRef.current);
    }
    interactionResumeTimerRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
      startAutoSlide();
    }, 2800);
  }, [startAutoSlide]);

  const onHeroMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / screenWidth);
      if (nextIndex >= 0 && nextIndex < galleryImages.length) {
        setHeroActiveIndex(nextIndex);
        heroIndexRef.current = nextIndex;
      }
      if (interactionResumeTimerRef.current) {
        clearTimeout(interactionResumeTimerRef.current);
      }
      interactionResumeTimerRef.current = setTimeout(() => {
        isUserInteractingRef.current = false;
        startAutoSlide();
      }, 2800);
    },
    [galleryImages.length, screenWidth, startAutoSlide],
  );

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      {/* 1. Collapsible Sticky Header Bar (Fades in when scrolling past hero) */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: insets.top + 4,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderBottomColor: colors.border,
            opacity: stickyHeaderAnim,
            transform: [
              {
                translateY: stickyHeaderAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-16, 0],
                }),
              },
            ],
          },
        ]}
        pointerEvents={isScrolledPastHero ? 'auto' : 'none'}
      >
        <View style={styles.stickyHeaderContent}>
          <Pressable
            hitSlop={12}
            onPress={() => navigation.goBack()}
            style={[styles.stickyIconBtn, { backgroundColor: colors.surfaceVariant }]}
            accessibilityLabel="ย้อนกลับ"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.stickyTitleWrap}>
            <Text numberOfLines={1} style={[styles.stickyTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
              {article.title}
            </Text>
            <Text numberOfLines={1} style={[styles.stickySubtitle, { color: colors.primary, fontSize: 11 * scale }]}>
              {selectedFeed?.label || article.author || 'IT News'}
            </Text>
          </View>

          <View style={styles.stickyActions}>
            <Pressable
              hitSlop={8}
              onPress={() => toggleBookmark(article)}
              style={[styles.stickyIconBtn, { backgroundColor: colors.surfaceVariant }]}
              accessibilityLabel="บุ๊กมาร์กข่าว"
            >
              <MaterialCommunityIcons
                name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                size={20}
                color={bookmarked ? '#3B82F6' : colors.text}
              />
            </Pressable>

            <Pressable
              hitSlop={8}
              onPress={() => {
                void shareArticle(article, selectedFeed?.label);
                showToast('เปิดการแชร์ข่าว');
              }}
              style={[styles.stickyIconBtn, { backgroundColor: colors.surfaceVariant }]}
              accessibilityLabel="แชร์ข่าว"
            >
              <MaterialCommunityIcons name="share-variant-outline" size={19} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </Animated.View>

      {/* 2. Reading Progress Bar (Top of screen, tracking 0-100%) */}
      <View
        pointerEvents="none"
        style={[
          styles.readingProgressTrack,
          {
            top: isScrolledPastHero ? insets.top + 52 : insets.top,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View
          style={[
            styles.readingProgressFill,
            {
              width: `${Math.round(readingProgress * 100)}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={onMainScroll}
      >
        {/* 1. Immersive Hero Image Container with Auto-slide Carousel */}
        <View style={[styles.heroContainer, { height: heroHeight, width: screenWidth }]}>
          {galleryImages.length > 1 ? (
            <ScrollView
              ref={heroScrollRef}
              horizontal
              pagingEnabled
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={onHeroScroll}
              onScrollBeginDrag={onHeroScrollBeginDrag}
              onScrollEndDrag={onHeroScrollEndDrag}
              onMomentumScrollEnd={onHeroMomentumScrollEnd}
              style={styles.heroSliderScroll}
            >
              {galleryImages.map((imgUrl, idx) => (
                <Pressable
                  key={`${imgUrl}-${idx}`}
                  style={[styles.heroSlideItem, { width: screenWidth, height: heroHeight }]}
                  onPress={() => {
                    setViewerInitialIndex(idx);
                    setViewerVisible(true);
                  }}
                  accessibilityLabel={`รูปภาพประกอบที่ ${idx + 1}`}
                >
                  {!heroFailedIndices[idx] ? (
                    <Image
                      source={{ uri: imgUrl }}
                      style={styles.heroImage}
                      resizeMode="cover"
                      onError={() =>
                        setHeroFailedIndices((prev) => ({ ...prev, [idx]: true }))
                      }
                    />
                  ) : (
                    <View
                      style={[
                        styles.heroFallback,
                        { backgroundColor: isDark ? '#111827' : '#1E293B' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="image-broken-variant"
                        size={64}
                        color="#64748B"
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          ) : displayImageUrl ? (
            <Image
              source={{ uri: displayImageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.heroFallback,
                { backgroundColor: isDark ? '#111827' : '#1E293B' },
              ]}
            >
              <MaterialCommunityIcons
                name="newspaper-variant-outline"
                size={76}
                color="#64748B"
              />
            </View>
          )}

          {/* True seamless LinearGradient from transparent to deep contrast */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.0)',
              'rgba(0, 0, 0, 0.04)',
              'rgba(0, 0, 0, 0.28)',
              'rgba(0, 0, 0, 0.74)',
              'rgba(0, 0, 0, 0.96)',
            ]}
            locations={[0, 0.38, 0.62, 0.84, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* Floating Top Navigation: Back Button (Left), Bookmark & Share (Right) */}
          <View style={[styles.floatingNav, { top: insets.top + 10 }]} pointerEvents="box-none">
            <Pressable
              hitSlop={12}
              onPress={() => navigation.goBack()}
              style={styles.minimalBackBtn}
              accessibilityLabel="ย้อนกลับ"
            >
              <MaterialCommunityIcons name="arrow-left" size={26} color="#FFFFFF" style={styles.iconShadow} />
            </Pressable>

            <View style={styles.floatingNavRight}>
              <Pressable
                hitSlop={8}
                onPress={() => toggleBookmark(article)}
                style={styles.floatingGlassBtn}
                accessibilityLabel="บุ๊กมาร์กข่าว"
              >
                <MaterialCommunityIcons
                  name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={21}
                  color={bookmarked ? '#60A5FA' : '#FFFFFF'}
                />
              </Pressable>

              <Pressable
                hitSlop={8}
                onPress={() => void shareArticle(article, selectedFeed?.label)}
                style={styles.floatingGlassBtn}
                accessibilityLabel="แชร์ข่าว"
              >
                <MaterialCommunityIcons name="share-variant-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Overlaid Hero Content (Category Pill, Counter/Dots, Title, Subtitle) */}
          <View style={styles.heroContentWrap} pointerEvents="box-none">
            {/* Meta Row: Frosted Glass Category Pill (Left) + Dots & Photo Counter (Right) */}
            <View style={styles.heroMetaRow}>
              <View style={styles.categoryPill}>
                <Text style={[styles.categoryPillText, { fontSize: 12 * scale }]}>
                  {selectedFeed?.label || 'เทคโนโลยี'}
                </Text>
              </View>

              {galleryImages.length > 1 && (
                <View style={styles.heroMetaRight}>
                  {/* Subtle Interactive Dots */}
                  <View style={styles.heroDotsRow}>
                    {galleryImages.map((_, idx) => (
                      <Pressable
                        key={`hero-dot-${idx}`}
                        hitSlop={6}
                        onPress={() => {
                          setHeroActiveIndex(idx);
                          heroIndexRef.current = idx;
                          heroScrollRef.current?.scrollTo({ x: idx * screenWidth, animated: true });
                        }}
                        style={[
                          styles.heroDot,
                          heroActiveIndex === idx ? styles.heroDotActive : styles.heroDotInactive,
                        ]}
                      />
                    ))}
                  </View>

                  {/* Photo Counter Pill (Tap to open full screen viewer) */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => {
                      setViewerInitialIndex(heroActiveIndex);
                      setViewerVisible(true);
                    }}
                    style={styles.heroCounterBadge}
                    accessibilityLabel="ดูรูปภาพทั้งหมด"
                  >
                    <MaterialCommunityIcons name="image-multiple-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.heroCounterText}>
                      {heroActiveIndex + 1} / {galleryImages.length}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Main Hero Headline */}
            <Text
              numberOfLines={3}
              style={[
                styles.heroTitle,
                {
                  fontSize: 22 * scale,
                  lineHeight: Math.round(22 * scale * typography.title.lineHeightMultiplier),
                  fontFamily: typography.fontFamily,
                },
              ]}
            >
              {article.title}
            </Text>

            {/* Subtitle / Short Lead Teaser (Only if not duplicate of title) */}
            {article.description && !isDescDuplicate ? (
              <Text
                numberOfLines={2}
                style={[
                  styles.heroSubtitle,
                  {
                    fontSize: 13 * scale,
                    lineHeight: 18 * scale,
                    fontFamily: typography.fontFamily,
                  },
                ]}
              >
                {stripHtml(article.description).trim()}
              </Text>
            ) : null}
          </View>
        </View>

        {/* 2. Overlapping Curved Sheet Card Container */}
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          {/* Metadata Chips Row: Author Pill, Time Pill, Views Pill */}
          <View style={styles.metaChipsRow}>
            {/* Author Chip (Dark Pill + Avatar) */}
            <View style={[styles.authorChip, { backgroundColor: isDark ? '#262A36' : '#181A20' }]}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarLetter}>
                  {(article.author || selectedFeed?.label || 'T')[0]?.toUpperCase()}
                </Text>
              </View>
              <Text numberOfLines={1} style={[styles.authorNameText, { fontSize: 12.5 * scale }]}>
                {article.author || selectedFeed?.label || 'Tech Reporter'}
              </Text>
            </View>

            {/* Time Chip (Light Pill + Clock) */}
            <View style={[styles.infoChip, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.muted} />
              <Text style={[styles.infoChipText, { color: colors.text, fontSize: 12 * scale }]}>
                {formatRelative(article.publishedMillis) || 'ล่าสุด'}
              </Text>
            </View>

            {/* Reading Duration Chip (Light Pill + Eye) */}
            <View style={[styles.infoChip, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="eye-outline" size={15} color={colors.muted} />
              <Text style={[styles.infoChipText, { color: colors.text, fontSize: 12 * scale }]}>
                {article.readingTime ? `${article.readingTime} นาที` : '2 นาที'}
              </Text>
            </View>
          </View>

          {/* AI Controls Row (If AI enabled) */}
          {isAiEnabled && (
            <View style={styles.aiControlsRow}>
              {/* Voice Player Button */}
              <Pressable
                hitSlop={8}
                onPress={() => handleToggleVoice()}
                style={[
                  styles.voicePlayBtn,
                  { backgroundColor: isVoicePlaying ? '#EF4444' : '#6366F1' },
                ]}
              >
                <MaterialCommunityIcons
                  name={isVoicePlaying ? 'pause-circle' : 'volume-high'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={[styles.voicePlayBtnText, { fontSize: 12.5 * scale }]}>
                  {isVoicePlaying ? 'หยุดฟัง' : 'ฟังเสียง AI'}
                </Text>
              </Pressable>

              {/* Mode Switcher Tabs */}
              <View style={[styles.modeTabsTrack, { backgroundColor: colors.surfaceVariant }]}>
                <Pressable
                  onPress={() => setReaderMode('ai')}
                  style={[
                    styles.modeTabPill,
                    readerMode === 'ai' && [
                      styles.modeTabPillActive,
                      { backgroundColor: isDark ? '#4F46E5' : '#6366F1' },
                    ],
                  ]}
                >
                  <MaterialCommunityIcons
                    name="creation"
                    size={14}
                    color={readerMode === 'ai' ? '#FFFFFF' : colors.muted}
                  />
                  <Text
                    style={[
                      styles.modeTabPillText,
                      {
                        color: readerMode === 'ai' ? '#FFFFFF' : colors.muted,
                        fontWeight: readerMode === 'ai' ? '700' : '500',
                        fontSize: 12 * scale,
                      },
                    ]}
                  >
                    สรุป AI
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setReaderMode('full')}
                  style={[
                    styles.modeTabPill,
                    readerMode === 'full' && [
                      styles.modeTabPillActive,
                      { backgroundColor: colors.surface },
                    ],
                  ]}
                >
                  <MaterialCommunityIcons
                    name="newspaper-variant-outline"
                    size={14}
                    color={readerMode === 'full' ? colors.primary : colors.muted}
                  />
                  <Text
                    style={[
                      styles.modeTabPillText,
                      {
                        color: readerMode === 'full' ? colors.text : colors.muted,
                        fontWeight: readerMode === 'full' ? '700' : '500',
                        fontSize: 12 * scale,
                      },
                    ]}
                  >
                    ฉบับเต็ม
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Quick Reader Toolbar: Font Sizer (ก- / 100% / ก+) & Share */}
          <View
            style={[
              styles.readerToolbar,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.fontSizerGroup}>
              <MaterialCommunityIcons name="format-size" size={16} color={colors.muted} />
              <Text style={[styles.fontSizerLabel, { color: colors.muted, fontSize: 11.5 * scale }]}>
                ขนาดอักษร:
              </Text>

              <Pressable
                hitSlop={6}
                onPress={() => adjustFontScale(-0.1)}
                disabled={fontScaleMultiplier <= 0.85}
                style={[
                  styles.fontStepBtn,
                  { backgroundColor: colors.surface },
                  fontScaleMultiplier <= 0.85 && styles.fontStepBtnDisabled,
                ]}
                accessibilityLabel="ลดขนาดตัวอักษร"
              >
                <Text
                  style={[
                    styles.fontStepText,
                    {
                      color: fontScaleMultiplier <= 0.85 ? colors.muted : colors.text,
                      fontSize: 11 * scale,
                    },
                  ]}
                >
                  ก-
                </Text>
              </Pressable>

              <Pressable
                hitSlop={6}
                onPress={resetFontScale}
                style={[styles.fontBadge, { backgroundColor: colors.surface }]}
                accessibilityLabel="รีเซ็ตขนาดตัวอักษร"
              >
                <Text style={[styles.fontBadgeText, { color: colors.primary, fontSize: 11.5 * scale }]}>
                  {Math.round(fontScaleMultiplier * 100)}%
                </Text>
              </Pressable>

              <Pressable
                hitSlop={6}
                onPress={() => adjustFontScale(0.1)}
                disabled={fontScaleMultiplier >= 1.35}
                style={[
                  styles.fontStepBtn,
                  { backgroundColor: colors.surface },
                  fontScaleMultiplier >= 1.35 && styles.fontStepBtnDisabled,
                ]}
                accessibilityLabel="เพิ่มขนาดตัวอักษร"
              >
                <Text
                  style={[
                    styles.fontStepText,
                    {
                      color: fontScaleMultiplier >= 1.35 ? colors.muted : colors.text,
                      fontSize: 11 * scale,
                    },
                  ]}
                >
                  ก+
                </Text>
              </Pressable>
            </View>

            <Pressable
              hitSlop={6}
              onPress={() => {
                void shareArticle(article, selectedFeed?.label);
                showToast('เปิดการแชร์ข่าว');
              }}
              style={[styles.toolbarShareBtn, { backgroundColor: colors.surface }]}
              accessibilityLabel="แชร์ข่าวนี้"
            >
              <MaterialCommunityIcons name="share-variant-outline" size={15} color={colors.primary} />
              <Text style={[styles.toolbarShareText, { color: colors.text, fontSize: 11.5 * scale }]}>
                แชร์
              </Text>
            </Pressable>
          </View>

          {/* Embedded Video Player */}
          {article.videoUrl ? (
            <View style={styles.videoWrap}>
              <ArticleVideoPlayer videoUrl={article.videoUrl} />
            </View>
          ) : null}

          {/* Article Main Content (AI Summary or Full Body) */}
          {isAiEnabled && readerMode === 'ai' ? (
            <AiReaderCard
              summary={aiSummary}
              articleTitle={article.title}
              isPlaying={isVoicePlaying}
              onTogglePlay={() => handleToggleVoice()}
              rate={speechRate}
              onRateChange={handleChangeRate}
            />
          ) : (
            <View style={styles.contentWrap}>
              <Text
                style={[
                  styles.bodyText,
                  {
                    color: colors.text,
                    fontSize: 16 * scale * fontScaleMultiplier,
                    lineHeight: Math.round(16 * scale * fontScaleMultiplier * typography.body.lineHeightMultiplier),
                    fontFamily: typography.fontFamily,
                  },
                ]}
              >
                {article.description || stripHtml(article.content || '')}
              </Text>
            </View>
          )}

          {/* Interactive News Reactions Bar */}
          <View
            style={[
              styles.reactionsContainer,
              {
                backgroundColor: colors.surfaceVariant,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.reactionsHeader}>
              <View style={styles.reactionsHeaderLeft}>
                <MaterialCommunityIcons name="heart-pulse" size={17} color="#EF4444" />
                <Text style={[styles.reactionsTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                  คุณรู้สึกอย่างไรกับข่าวนี้?
                </Text>
              </View>
              <Text style={[styles.reactionsSubtitle, { color: colors.muted, fontSize: 11 * scale }]}>
                แตะเพื่อโหวต
              </Text>
            </View>

            <View style={styles.reactionsGrid}>
              {REACTIONS_LIST.map((rx) => {
                const isSelected = userReaction === rx.key;
                const count = reactionCounts[rx.key] || 0;
                return (
                  <Pressable
                    key={rx.key}
                    onPress={() => handleToggleReaction(rx.key)}
                    style={[
                      styles.reactionItem,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(99, 102, 241, 0.22)'
                            : '#EEF2FF'
                          : colors.surface,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    accessibilityLabel={`${rx.label} (${count})`}
                  >
                    <Text style={styles.reactionEmoji}>{rx.emoji}</Text>
                    <Text
                      style={[
                        styles.reactionLabel,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: 11 * scale,
                        },
                      ]}
                    >
                      {rx.label}
                    </Text>
                    <View
                      style={[
                        styles.reactionCountBadge,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : isDark
                              ? '#374151'
                              : '#E5E7EB',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.reactionCountText,
                          { color: isSelected ? '#FFFFFF' : colors.muted },
                        ]}
                      >
                        {count}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 3. Photo Gallery Mini Thumbnails */}
          {galleryImages.length > 1 && (
            <View style={styles.gallerySection}>
              <View style={styles.galleryHeaderRow}>
                <View style={styles.galleryHeaderLeft}>
                  <MaterialCommunityIcons name="image-multiple-outline" size={16} color={colors.primary} />
                  <Text style={[styles.galleryTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                    รูปภาพประกอบข่าว ({galleryImages.length} รูป)
                  </Text>
                </View>
                <Text style={[styles.galleryHintText, { color: colors.muted, fontSize: 11 * scale }]}>
                  แตะดูขนาดเต็ม
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {galleryImages.map((imgUrl, index) => {
                  const isActive = heroActiveIndex === index;
                  return (
                    <Pressable
                      key={imgUrl + index}
                      onPress={() => {
                        setHeroActiveIndex(index);
                        heroIndexRef.current = index;
                        heroScrollRef.current?.scrollTo({ x: index * screenWidth, animated: true });
                        setViewerInitialIndex(index);
                        setViewerVisible(true);
                      }}
                      style={[
                        styles.galleryCard,
                        {
                          borderColor: isActive ? colors.primary : colors.border,
                          borderWidth: isActive ? 2 : 1,
                        },
                      ]}
                      accessibilityLabel={`ดูรูปภาพประกอบที่ ${index + 1}`}
                    >
                      <Image source={{ uri: imgUrl }} style={styles.galleryImage} resizeMode="cover" />
                      <View style={styles.galleryIndexBadge}>
                        <Text style={styles.galleryIndexText}>{index + 1}</Text>
                      </View>
                      <View style={styles.galleryZoomIcon}>
                        <MaterialCommunityIcons name="magnify-plus-outline" size={11} color="#FFFFFF" />
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* AdMob Banner */}
          <AdBanner style={styles.detailAdBanner} />

          {/* Open Original Source Web Link Button */}
          <Pressable
            hitSlop={8}
            onPress={() => {
              if (settings.linkOpenMode === 'external') {
                void Linking.openURL(article.link);
              } else {
                navigation.navigate('WebView', { url: article.link, title: article.title });
              }
            }}
            style={[styles.openButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.openText, { color: colors.onPrimary, fontSize: 15 * scale }]}>
              {settings.linkOpenMode === 'external'
                ? 'เปิดอ่านข่าวต้นฉบับ (เบราว์เซอร์ภายนอก)'
                : 'เปิดอ่านข่าวต้นฉบับฉบับเต็ม'}
            </Text>
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.onPrimary} />
          </Pressable>

          {/* Next Article Card (อ่านข่าวถัดไปทันที) */}
          {nextArticle && (
            <View style={styles.nextArticleSection}>
              <View style={styles.nextArticleHeaderRow}>
                <View style={[styles.nextArticleBadge, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="skip-next" size={14} color="#FFFFFF" />
                  <Text style={[styles.nextArticleBadgeText, { fontSize: 11 * scale }]}>
                    อ่านข่าวถัดไป
                  </Text>
                </View>
                <Text style={[styles.nextArticleTime, { color: colors.muted, fontSize: 11.5 * scale }]}>
                  {formatRelative(nextArticle.publishedMillis)}
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  markAsRead(nextArticle.id);
                  void showInterstitialAndNavigate(() => {
                    navigation.push('Article', { articleId: nextArticle.id, article: nextArticle });
                  });
                }}
                style={[
                  styles.nextArticleCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.border,
                  },
                ]}
                accessibilityLabel={`อ่านข่าวถัดไป: ${nextArticle.title}`}
              >
                {nextArticle.imageUrl ? (
                  <Image
                    source={{ uri: sanitizeImageUrl(nextArticle.imageUrl) }}
                    style={styles.nextArticleThumb}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.nextArticleThumbFallback, { backgroundColor: colors.surface }]}>
                    <MaterialCommunityIcons name="newspaper-variant-outline" size={26} color={colors.muted} />
                  </View>
                )}

                <View style={styles.nextArticleInfo}>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.nextArticleTitle,
                      {
                        color: colors.text,
                        fontSize: 13.5 * scale,
                        lineHeight: Math.round(13.5 * scale * 1.35),
                      },
                    ]}
                  >
                    {nextArticle.title}
                  </Text>

                  <View style={styles.nextArticleFooterRow}>
                    <Text
                      numberOfLines={1}
                      style={[styles.nextArticleSource, { color: colors.muted, fontSize: 11 * scale }]}
                    >
                      {nextArticle.author || selectedFeed?.label || 'IT News'}
                    </Text>
                    <View style={styles.nextArticleActionBtn}>
                      <Text style={[styles.nextArticleActionText, { color: colors.primary, fontSize: 11.5 * scale }]}>
                        อ่านต่อ
                      </Text>
                      <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          )}

          {/* ข่าวอื่นๆ ที่น่าสนใจ (Remaining Related News Section) */}
          {remainingRelated.length > 0 && (
            <View style={[styles.relatedSection, { borderTopColor: colors.border }]}>
              <View style={styles.relatedHeaderRow}>
                <View style={[styles.relatedHeaderIconWrap, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialCommunityIcons
                    name="newspaper-variant-multiple-outline"
                    size={18 * scale}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.relatedSectionTitle, { color: colors.text, fontSize: 17 * scale }]}>
                  ข่าวอื่นๆ ที่น่าสนใจ
                </Text>
              </View>

              <View style={styles.relatedList}>
                {remainingRelated.map((item) => (
                  <NewsCard
                    key={item.id}
                    article={item}
                    layout="compact"
                    isBookmarked={Boolean(bookmarks[item.id])}
                    onToggleBookmark={() => toggleBookmark(item)}
                    onPress={() => {
                      markAsRead(item.id);
                      void showInterstitialAndNavigate(() => {
                        navigation.push('Article', { articleId: item.id });
                      });
                    }}
                  />
                ))}
              </View>

              {/* Ads Card ต่อจากข่าวอื่นๆ */}
              <AdCard title="ผู้สนับสนุนเนื้อหา" style={styles.relatedAdCard} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Scroll-to-Top Floating Action Button */}
      <Animated.View
        style={[
          styles.scrollTopFabWrap,
          {
            bottom: insets.bottom + 22,
            opacity: scrollTopAnim,
            transform: [
              {
                scale: scrollTopAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.6, 1],
                }),
              },
            ],
          },
        ]}
        pointerEvents={showScrollTop ? 'auto' : 'none'}
      >
        <Pressable
          hitSlop={8}
          onPress={handleScrollToTop}
          style={[
            styles.scrollTopFab,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
          accessibilityLabel="เลื่อนกลับด้านบนสุด"
        >
          <MaterialCommunityIcons name="arrow-up" size={22} color={colors.primary} />
        </Pressable>
      </Animated.View>

      {/* Full Screen Image Viewer Modal */}
      {galleryImages.length > 0 && (
        <ImageViewerModal
          visible={viewerVisible}
          images={galleryImages}
          initialIndex={viewerInitialIndex}
          onIndexChange={(newIdx) => {
            setHeroActiveIndex(newIdx);
            heroIndexRef.current = newIdx;
            heroScrollRef.current?.scrollTo({ x: newIdx * screenWidth, animated: false });
          }}
          onClose={() => setViewerVisible(false)}
        />
      )}

      {/* Animated Toast Feedback */}
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
          <MaterialCommunityIcons name="check-circle" size={17} color="#10B981" />
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

  /* 1. Immersive Hero Styles */
  heroContainer: {
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroSliderScroll: {
    ...StyleSheet.absoluteFill,
  },
  heroSlideItem: {
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingNav: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  floatingNavRight: {
    flexDirection: 'row',
    gap: 10,
  },
  minimalBackBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  floatingGlassBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroContentWrap: {
    paddingBottom: 22, // Brought down smoothly closer to the curved sheet
    paddingHorizontal: 20,
    zIndex: 10,
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  heroMetaRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  heroDotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  heroDot: {
    borderRadius: 3,
    height: 6,
  },
  heroDotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  heroDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    width: 6,
  },
  heroCounterBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroCounterText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* 2. Overlapping Curved Sheet Card */
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -26,
    paddingHorizontal: 20,
    paddingTop: 20,
    zIndex: 30,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },

  /* Metadata Chips Row */
  metaChipsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  authorChip: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  avatarCircle: {
    alignItems: 'center',
    borderRadius: 11,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  authorNameText: {
    color: '#FFFFFF',
    fontWeight: '700',
    maxWidth: 130,
  },
  infoChip: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  infoChipText: {
    fontWeight: '600',
  },

  /* AI Controls */
  aiControlsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  voicePlayBtn: {
    alignItems: 'center',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  voicePlayBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeTabsTrack: {
    borderRadius: 20,
    flex: 1,
    flexDirection: 'row',
    gap: 3,
    padding: 3,
  },
  modeTabPill: {
    alignItems: 'center',
    borderRadius: 17,
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 7,
  },
  modeTabPillActive: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  modeTabPillText: {},

  videoWrap: {
    marginBottom: 14,
  },
  contentWrap: {
    marginTop: 6,
  },
  bodyText: {
    letterSpacing: 0.1,
  },

  /* 3. Photo Gallery Mini Thumbnails */
  gallerySection: {
    marginTop: 16,
    marginBottom: 4,
  },
  galleryHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  galleryHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  galleryTitle: {
    fontWeight: '700',
  },
  galleryHintText: {
    fontWeight: '500',
  },
  galleryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  galleryCard: {
    borderRadius: 10,
    height: 62,
    overflow: 'hidden',
    position: 'relative',
    width: 88,
  },
  galleryImage: {
    height: '100%',
    width: '100%',
  },
  galleryIndexBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 5,
    height: 16,
    justifyContent: 'center',
    left: 4,
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    top: 4,
  },
  galleryIndexText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '700',
  },
  galleryZoomIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 7,
    bottom: 4,
    height: 16,
    justifyContent: 'center',
    position: 'absolute',
    right: 4,
    width: 16,
  },

  /* AdBanner & Open Link */
  detailAdBanner: {
    borderRadius: 8,
    marginVertical: 16,
  },
  openButton: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    padding: 15,
  },
  openText: {
    fontWeight: '800',
    marginRight: 8,
  },

  /* Related Section */
  relatedSection: {
    borderTopWidth: 1,
    marginTop: 32,
    paddingTop: 22,
  },
  relatedHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  relatedHeaderIconWrap: {
    borderRadius: 8,
    padding: 6,
  },
  relatedSectionTitle: {
    fontWeight: '800',
  },
  relatedList: {
    gap: 12,
  },
  relatedAdCard: {
    marginTop: 16,
  },

  /* Sticky Header Styles */
  stickyHeader: {
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 90,
    borderBottomWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  stickyHeaderContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    height: 48,
    paddingHorizontal: 12,
  },
  stickyIconBtn: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stickyTitleWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  stickyTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  stickySubtitle: {
    fontWeight: '600',
  },
  stickyActions: {
    flexDirection: 'row',
    gap: 8,
  },

  /* Reading Progress Bar */
  readingProgressTrack: {
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 95,
  },
  readingProgressFill: {
    height: '100%',
  },

  /* Reader Toolbar (Quick Font Sizer & Share) */
  readerToolbar: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  fontSizerGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  fontSizerLabel: {
    fontWeight: '600',
  },
  fontStepBtn: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 6,
  },
  fontStepBtnDisabled: {
    opacity: 0.45,
  },
  fontStepText: {
    fontWeight: '700',
  },
  fontBadge: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  fontBadgeText: {
    fontWeight: '800',
  },
  toolbarShareBtn: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 5,
    height: 28,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  toolbarShareText: {
    fontWeight: '700',
  },

  /* Interactive Reactions Bar */
  reactionsContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 10,
    padding: 14,
  },
  reactionsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  reactionsHeaderLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  reactionsTitle: {
    fontWeight: '700',
  },
  reactionsSubtitle: {
    fontWeight: '500',
  },
  reactionsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionItem: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    paddingVertical: 8,
  },
  reactionEmoji: {
    fontSize: 18,
  },
  reactionLabel: {},
  reactionCountBadge: {
    borderRadius: 10,
    marginTop: 2,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  reactionCountText: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  /* Next Article Card */
  nextArticleSection: {
    marginTop: 24,
    marginBottom: 6,
  },
  nextArticleHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextArticleBadge: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
  },
  nextArticleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  nextArticleTime: {
    fontWeight: '500',
  },
  nextArticleCard: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    padding: 10,
    gap: 12,
  },
  nextArticleThumb: {
    borderRadius: 10,
    height: 72,
    width: 72,
  },
  nextArticleThumbFallback: {
    alignItems: 'center',
    borderRadius: 10,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  nextArticleInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  nextArticleTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  nextArticleFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  nextArticleSource: {
    fontWeight: '500',
    maxWidth: 120,
  },
  nextArticleActionBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  nextArticleActionText: {
    fontWeight: '700',
  },

  /* Scroll-to-Top FAB */
  scrollTopFabWrap: {
    bottom: 24,
    position: 'absolute',
    right: 18,
    zIndex: 85,
  },
  scrollTopFab: {
    alignItems: 'center',
    borderRadius: 23,
    borderWidth: 1,
    elevation: 5,
    height: 46,
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    width: 46,
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
