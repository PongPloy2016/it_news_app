import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { AdBanner } from './AdBanner';
import { AdCard } from './AdCard';
import { AiReaderCard } from './AiReaderCard';
import { ArticleVideoPlayer } from './ArticleVideoPlayer';
import { NewsCard } from './NewsCard';
import { articleContentService, FullArticleResult } from '../services/articleContentService';
import { imageService } from '../services/imageService';
import { useNews } from '../store/NewsContext';
import { typography } from '../theme';
import { NewsArticle } from '../types';
import { cleanNewsContent, generateAiSummary } from '../utils/aiSummary';
import { estimateReadingTime, formatRelative, sanitizeImageUrl, stripHtml } from '../utils/content';
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

export interface ArticleDetailItemProps {
  article: NewsArticle;
  isActive: boolean;
  navigation: any;
  insets: EdgeInsets;
  screenWidth: number;
  screenHeight: number;
  heroHeight: number;
  articleCategory: { key: string; label: string };
  fontScaleMultiplier: number;
  setFontScaleMultiplier: (val: number | ((prev: number) => number)) => void;
  onOpenViewer: (images: string[], initialIdx: number) => void;
  onNextArticlePress?: () => void;
  onSelectRelatedArticle?: (targetArticle: NewsArticle) => void;
  showToast: (msg: string) => void;
}

export function ArticleDetailItem({
  article,
  isActive,
  navigation,
  insets,
  screenWidth,
  heroHeight,
  articleCategory,
  fontScaleMultiplier,
  setFontScaleMultiplier,
  onOpenViewer,
  onNextArticlePress,
  onSelectRelatedArticle,
  showToast,
}: ArticleDetailItemProps) {
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

  // Stop speaking when no longer active
  useEffect(() => {
    if (!isActive) {
      stopSpeaking();
      setIsVoicePlaying(false);
    }
  }, [isActive]);

  // Stop speaking on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Mark article as read when active
  useEffect(() => {
    if (isActive && article?.id) {
      markAsRead(article.id);
    }
  }, [isActive, article?.id, markAsRead]);

  // Content fetching
  const [fullArticleData, setFullArticleData] = useState<FullArticleResult | null>(null);
  const [isLoadingFullContent, setIsLoadingFullContent] = useState(false);

  const handleFetchFullContent = useCallback(
    async (force = false) => {
      if (!article?.link) return;
      setIsLoadingFullContent(true);
      try {
        const result = await articleContentService.getFullArticle(article.link, article.id, force);
        if (result && result.paragraphs.length > 0) {
          setFullArticleData(result);
        }
      } finally {
        setIsLoadingFullContent(false);
      }
    },
    [article?.link, article?.id],
  );

  useEffect(() => {
    let isMounted = true;
    if (!article?.link) return;

    setFullArticleData(null);

    const existingContent = article.content || article.description || '';
    if (existingContent.length > 500 && existingContent.includes('\n')) {
      return;
    }

    setIsLoadingFullContent(true);
    void articleContentService.getFullArticle(article.link, article.id).then((result) => {
      if (!isMounted) return;
      setIsLoadingFullContent(false);
      if (result && result.paragraphs.length > 0) {
        setFullArticleData(result);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [article?.link, article?.id]);

  const activeContent = fullArticleData?.fullText || article?.content || article?.description || '';

  const calculatedReadingTime = useMemo(() => {
    return estimateReadingTime(activeContent);
  }, [activeContent]);

  const aiSummary = useMemo(() => {
    if (!article) return null;
    return generateAiSummary(article.title, activeContent);
  }, [article, activeContent]);

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

  // News Reactions State
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

  useEffect(() => {
    if (!article) return;
    setImageError(false);
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
          ? `${article.title}. ${cleanNewsContent(activeContent)}`
          : aiSummary?.speechScript || article.title;

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
        ...(fullArticleData?.images || []),
      ].filter((url, idx, self) => url && typeof url === 'string' && self.indexOf(url) === idx),
    [displayImageUrl, detailImages, fullArticleData?.images],
  );

  return (
    <View style={styles.itemRoot}>
      {/* 1. Collapsible Sticky Header Bar */}
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
              {articleCategory.label || article.author || 'IT News'}
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

      {/* 2. Reading Progress Bar */}
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
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        bounces={false}
        scrollEventThrottle={16}
        onScroll={onMainScroll}
      >
        {/* 1. Immersive Hero Image Container */}
        <View style={[styles.heroContainer, { height: heroHeight, width: screenWidth }]}>
          <Pressable
            style={[styles.heroSlideItem, { width: screenWidth, height: heroHeight }]}
            onPress={() => {
              if (galleryImages.length > 0) {
                onOpenViewer(galleryImages, 0);
              }
            }}
            accessibilityLabel="รูปภาพประกอบข่าว"
          >
            {displayImageUrl ? (
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
                  name="image-broken-variant"
                  size={64}
                  color="#64748B"
                />
              </View>
            )}

            {galleryImages.length > 1 && (
              <View style={styles.galleryCountBadge}>
                <MaterialCommunityIcons name="image-multiple" size={12} color="#FFFFFF" />
                <Text style={styles.galleryCountText}>{galleryImages.length} รูป</Text>
              </View>
            )}
          </Pressable>

          {/* Cinematic Bottom Gradient Overlay */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.45)',
              'rgba(0, 0, 0, 0.1)',
              'rgba(0, 0, 0, 0.4)',
              'rgba(0, 0, 0, 0.82)',
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
                onPress={() => {
                  void shareArticle(article, selectedFeed?.label);
                  showToast('เปิดการแชร์ข่าว');
                }}
                style={styles.floatingGlassBtn}
                accessibilityLabel="แชร์ข่าว"
              >
                <MaterialCommunityIcons name="share-variant-outline" size={19} color="#FFFFFF" />
              </Pressable>
            </View>
          </View>

          {/* Overlaid Headline & Category at Hero Bottom */}
          <View style={styles.heroOverlayContent}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.heroCategoryPill, { backgroundColor: colors.primary }]}>
                <Text style={[styles.heroCategoryText, { fontSize: 10.5 * scale }]}>
                  {articleCategory.label || selectedFeed?.label || 'IT News'}
                </Text>
              </View>

              <View style={styles.heroTimeBadge}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="rgba(255, 255, 255, 0.85)" />
                <Text style={[styles.heroTimeText, { fontSize: 11 * scale }]}>
                  {formatRelative(article.publishedMillis)}
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroTitle,
                {
                  fontSize: Math.min(23 * scale, 26),
                  lineHeight: Math.min(23 * scale * 1.35, 36),
                },
              ]}
            >
              {article.title}
            </Text>

            <View style={styles.heroAuthorRow}>
              <View style={styles.heroAuthorAvatar}>
                <MaterialCommunityIcons name="newspaper-variant" size={14} color="#FFFFFF" />
              </View>
              <Text numberOfLines={1} style={[styles.heroAuthorName, { fontSize: 12 * scale }]}>
                {article.author || selectedFeed?.label || 'กองบรรณาธิการ'}
              </Text>
              <Text style={styles.heroDot}>•</Text>
              <Text style={[styles.heroReadTime, { fontSize: 11.5 * scale }]}>
                อ่าน {calculatedReadingTime} นาที
              </Text>
            </View>
          </View>
        </View>

        {/* 2. Reader Body Section */}
        <View style={styles.contentWrap}>
          {/* Quick Font Sizer Toolbar */}
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
              <Text style={[styles.fontSizerLabel, { color: colors.muted, fontSize: 11.5 * scale }]}>
                ขนาดตัวอักษร:
              </Text>
              <Pressable
                onPress={() => adjustFontScale(-0.05)}
                disabled={fontScaleMultiplier <= 0.85}
                style={[
                  styles.fontStepBtn,
                  { backgroundColor: colors.surface },
                  fontScaleMultiplier <= 0.85 && styles.fontStepBtnDisabled,
                ]}
                hitSlop={6}
              >
                <Text style={[styles.fontStepText, { color: colors.text, fontSize: 13 * scale }]}>ก-</Text>
              </Pressable>

              <Pressable
                onPress={resetFontScale}
                style={[styles.fontBadge, { backgroundColor: colors.surface }]}
                hitSlop={6}
              >
                <Text style={[styles.fontBadgeText, { color: colors.primary, fontSize: 11.5 * scale }]}>
                  {Math.round(fontScaleMultiplier * 100)}%
                </Text>
              </Pressable>

              <Pressable
                onPress={() => adjustFontScale(0.05)}
                disabled={fontScaleMultiplier >= 1.35}
                style={[
                  styles.fontStepBtn,
                  { backgroundColor: colors.surface },
                  fontScaleMultiplier >= 1.35 && styles.fontStepBtnDisabled,
                ]}
                hitSlop={6}
              >
                <Text style={[styles.fontStepText, { color: colors.text, fontSize: 13 * scale }]}>ก+</Text>
              </Pressable>
            </View>

            <Pressable
              hitSlop={8}
              onPress={() => {
                void shareArticle(article, selectedFeed?.label);
                showToast('เปิดการแชร์ข่าว');
              }}
              style={[styles.toolbarShareBtn, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons name="share-variant-outline" size={15} color={colors.primary} />
              <Text style={[styles.toolbarShareText, { color: colors.primary, fontSize: 11.5 * scale }]}>
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

          {/* Article Main Content (AI Summary or Full Body) */}
          {isAiEnabled && readerMode === 'ai' && aiSummary ? (
            <AiReaderCard
              summary={aiSummary}
              articleTitle={article.title}
              isPlaying={isVoicePlaying}
              onTogglePlay={() => handleToggleVoice()}
              rate={speechRate}
              onRateChange={handleChangeRate}
            />
          ) : (
            <>
              {/* Description Lead */}
              {article.description && !isDescDuplicate && (
                <View
                  style={[
                    styles.leadContainer,
                    {
                      backgroundColor: colors.surfaceVariant,
                      borderLeftColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.leadText,
                      {
                        color: colors.text,
                        fontSize: Math.round(15.5 * scale * fontScaleMultiplier),
                        lineHeight: Math.round(15.5 * scale * fontScaleMultiplier * 1.55),
                      },
                    ]}
                  >
                    {stripHtml(article.description)}
                  </Text>
                </View>
              )}

              {/* Full Scraped Content */}
              {fullArticleData?.paragraphs && fullArticleData.paragraphs.length > 0 ? (
                <>
                  <View style={styles.fullArticleBadgeRow}>
                    <View
                      style={[
                        styles.fullArticleBadge,
                        {
                          backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                          borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#DBEAFE',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="newspaper-variant-outline" size={14} color={colors.primary} />
                      <Text style={[styles.fullArticleBadgeText, { color: colors.primary }]}>
                        เนื้อหาข่าวฉบับเต็ม ({fullArticleData.paragraphs.length} ย่อหน้า)
                      </Text>
                    </View>
                    <Pressable
                      hitSlop={8}
                      onPress={() => void handleFetchFullContent(true)}
                      style={[
                        styles.refetchBtn,
                        {
                          backgroundColor: colors.surfaceVariant,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons name="refresh" size={13} color={colors.muted} />
                      <Text style={[styles.refetchBtnText, { color: colors.muted }]}>ดึงใหม่</Text>
                    </Pressable>
                  </View>

                  {fullArticleData.paragraphs.map((paragraph, index) => {
                    const isHeading = paragraph.startsWith('📌 ');
                    const isQuote = paragraph.startsWith('“') && paragraph.endsWith('”');
                    const isList = paragraph.startsWith('• ');

                    if (isHeading) {
                      return (
                        <Text
                          key={`para-${index}`}
                          style={[
                            styles.headingText,
                            {
                              color: colors.primary,
                              fontSize: 17 * scale * fontScaleMultiplier,
                              fontFamily: typography.fontFamily,
                            },
                          ]}
                        >
                          {paragraph.replace(/^📌\s*/, '')}
                        </Text>
                      );
                    }

                    if (isQuote) {
                      return (
                        <View
                          key={`para-${index}`}
                          style={[
                            styles.quoteBox,
                            {
                              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                              borderLeftColor: colors.primary,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quoteText,
                              {
                                color: colors.text,
                                fontSize: 15.5 * scale * fontScaleMultiplier,
                                lineHeight: Math.round(15.5 * scale * fontScaleMultiplier * typography.body.lineHeightMultiplier),
                                fontFamily: typography.fontFamily,
                              },
                            ]}
                          >
                            {paragraph}
                          </Text>
                        </View>
                      );
                    }

                    return (
                      <Text
                        key={`para-${index}`}
                        style={[
                          styles.bodyParagraph,
                          styles.paragraphSpacing,
                          isList && styles.listParagraph,
                          {
                            color: colors.text,
                            fontSize: 15.5 * scale * fontScaleMultiplier,
                            lineHeight: Math.round(15.5 * scale * fontScaleMultiplier * 1.6),
                          },
                        ]}
                      >
                        {paragraph}
                      </Text>
                    );
                  })}
                </>
              ) : (
                <Text
                  style={[
                    styles.bodyParagraph,
                    {
                      color: colors.text,
                      fontSize: 15.5 * scale * fontScaleMultiplier,
                      lineHeight: Math.round(15.5 * scale * fontScaleMultiplier * 1.6),
                    },
                  ]}
                >
                  {cleanNewsContent(activeContent)}
                </Text>
              )}

              {/* Loading Full Content Indicator */}
              {isLoadingFullContent && (
                <View style={styles.loadingFullWrap}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.loadingFullText, { color: colors.muted, fontSize: 12 * scale }]}>
                    กำลังดึงเนื้อหาข่าวฉบับเต็มจากต้นฉบับ...
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Reader Reactions */}
          <View style={[styles.reactionSection, { borderColor: colors.border }]}>
            <Text style={[styles.reactionTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
              คุณคิดอย่างไรกับข่าวนี้?
            </Text>
            <View style={styles.reactionRow}>
              {REACTIONS_LIST.map((rx) => {
                const isSelected = userReaction === rx.key;
                const count = reactionCounts[rx.key] || 0;
                return (
                  <Pressable
                    key={rx.key}
                    hitSlop={4}
                    onPress={() => handleToggleReaction(rx.key)}
                    style={[
                      styles.reactionChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={styles.reactionEmoji}>{rx.emoji}</Text>
                    <Text
                      style={[
                        styles.reactionCountText,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontSize: 12 * scale,
                        },
                      ]}
                    >
                      {count}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Ad Banner inside content */}
          <AdBanner style={styles.detailAdBanner} />

          {/* Open Original Source Link Button */}
          <Pressable
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

          {/* Next Article Card */}
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
                  if (onNextArticlePress) {
                    onNextArticlePress();
                  } else {
                    markAsRead(nextArticle.id);
                    navigation.push('Article', { articleId: nextArticle.id, article: nextArticle });
                  }
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

          {/* Related News Section */}
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
                      if (onSelectRelatedArticle) {
                        onSelectRelatedArticle(item);
                      } else {
                        markAsRead(item.id);
                        navigation.push('Article', { articleId: item.id });
                      }
                    }}
                  />
                ))}
              </View>

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
            bottom: insets.bottom + 68,
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
    </View>
  );
}

const styles = StyleSheet.create({
  itemRoot: {
    flex: 1,
  },
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    left: 0,
    paddingBottom: 10,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    top: 0,
    zIndex: 100,
  },
  stickyHeaderContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  stickyIconBtn: {
    alignItems: 'center',
    borderRadius: 20,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  stickyTitleWrap: {
    flex: 1,
  },
  stickyTitle: {
    fontWeight: '700',
  },
  stickySubtitle: {
    fontWeight: '600',
    marginTop: 2,
  },
  stickyActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
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
  heroContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  heroSlideItem: {
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  heroFallback: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  galleryCountBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    bottom: 95,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  galleryCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 20,
  },
  minimalBackBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  floatingNavRight: {
    flexDirection: 'row',
    gap: 8,
  },
  floatingGlassBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  heroOverlayContent: {
    bottom: 16,
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 15,
  },
  heroBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  heroCategoryPill: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroCategoryText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroTimeBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  heroTimeText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroAuthorRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroAuthorAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    marginRight: 6,
    width: 20,
  },
  heroAuthorName: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    maxWidth: 160,
  },
  heroDot: {
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 6,
  },
  heroReadTime: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  contentWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  toolbarShareText: {
    fontWeight: '700',
  },
  videoWrap: {
    marginBottom: 14,
  },
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
  fullArticleBadgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  fullArticleBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  fullArticleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  refetchBtn: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  refetchBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  headingText: {
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 10,
    marginTop: 20,
  },
  quoteBox: {
    borderLeftWidth: 3.5,
    borderRadius: 8,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paragraphSpacing: {
    marginBottom: 16,
  },
  listParagraph: {
    paddingLeft: 8,
  },
  leadContainer: {
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  leadText: {
    fontWeight: '600',
  },
  scrapedBodyWrap: {
    marginBottom: 16,
  },
  bodyParagraph: {
    marginBottom: 14,
  },
  quoteCard: {
    borderRadius: 10,
    borderLeftWidth: 4,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  quoteText: {
    fontStyle: 'italic',
    fontWeight: '500',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    borderRadius: 3,
    height: 6,
    marginRight: 10,
    marginTop: 8,
    width: 6,
  },
  bulletText: {
    flex: 1,
  },
  loadingFullWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginVertical: 16,
  },
  loadingFullText: {
    fontWeight: '500',
  },
  reactionSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginVertical: 16,
    paddingTop: 16,
  },
  reactionTitle: {
    fontWeight: '700',
    marginBottom: 10,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reactionChip: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionCountText: {
    fontWeight: '700',
  },
  detailAdBanner: {
    marginVertical: 16,
  },
  openButton: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 24,
    paddingVertical: 14,
  },
  openText: {
    fontWeight: '700',
  },
  nextArticleSection: {
    marginBottom: 20,
  },
  nextArticleHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nextArticleBadge: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  nextArticleBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
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
    marginLeft: 10,
  },
  nextArticleTitle: {
    fontWeight: '700',
  },
  nextArticleFooterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextArticleSource: {
    fontWeight: '500',
    maxWidth: 160,
  },
  nextArticleActionBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  nextArticleActionText: {
    fontWeight: '700',
  },
  relatedSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  relatedHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  relatedHeaderIconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  relatedSectionTitle: {
    fontWeight: '800',
  },
  relatedList: {
    gap: 10,
  },
  relatedAdCard: {
    marginTop: 14,
  },
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
});
