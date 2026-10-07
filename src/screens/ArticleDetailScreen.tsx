import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Share,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const heroHeight = Math.max(430, Math.min(520, screenHeight * 0.52));

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

  const otherArticles = useMemo(() => {
    if (!article) return [];
    const limit = remoteSettings.related_news_limit ?? 10;
    return articles.filter((item) => item.id !== article.id).slice(0, limit);
  }, [articles, article, remoteSettings.related_news_limit]);

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

  const galleryImages = [
    ...(displayImageUrl ? [displayImageUrl] : []),
    ...(detailImages || []),
  ].filter((url, idx, self) => url && self.indexOf(url) === idx);

  return (
    <View style={[styles.rootContainer, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 + insets.bottom }}
        bounces={false}
      >
        {/* 1. Immersive Hero Image Container */}
        <View style={[styles.heroContainer, { height: heroHeight, width: screenWidth }]}>
          {displayImageUrl ? (
            <Image
              source={{ uri: displayImageUrl }}
              style={styles.heroImage}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.heroFallback, { backgroundColor: isDark ? '#111827' : '#1E293B' }]}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={76} color="#64748B" />
            </View>
          )}

          {/* True seamless LinearGradient from transparent to deep contrast */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.0)',
              'rgba(0, 0, 0, 0.06)',
              'rgba(0, 0, 0, 0.35)',
              'rgba(0, 0, 0, 0.72)',
              'rgba(0, 0, 0, 0.95)',
            ]}
            locations={[0, 0.28, 0.55, 0.78, 1]}
            style={StyleSheet.absoluteFill}
          />

          {/* Floating Top Navigation: Back Button (Left), Bookmark & Share (Right) */}
          <View style={[styles.floatingNav, { top: insets.top + 10 }]}>
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

          {/* Overlaid Hero Content (Category Pill, Title, Subtitle) */}
          <View style={styles.heroContentWrap}>
            {/* Frosted Glass Category Pill */}
            <View style={styles.categoryPill}>
              <Text style={[styles.categoryPillText, { fontSize: 12 * scale }]}>
                {selectedFeed?.label || 'เทคโนโลยี'}
              </Text>
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

            {/* Subtitle / Short Lead Teaser */}
            {article.description ? (
              <Text
                numberOfLines={2}
                style={[
                  styles.heroSubtitle,
                  {
                    fontSize: 13.5 * scale,
                    lineHeight: 19 * scale,
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
                    fontSize: 16 * scale,
                    lineHeight: Math.round(16 * scale * typography.body.lineHeightMultiplier),
                    fontFamily: typography.fontFamily,
                  },
                ]}
              >
                {article.description || stripHtml(article.content || '')}
              </Text>
            </View>
          )}

          {/* 3. Photo Gallery Grid (Side-by-side photo cards like in screenshot) */}
          {galleryImages.length > 1 && (
            <View style={styles.gallerySection}>
              <View style={styles.galleryHeaderRow}>
                <MaterialCommunityIcons name="image-multiple-outline" size={18} color={colors.primary} />
                <Text style={[styles.galleryTitle, { color: colors.text, fontSize: 15 * scale }]}>
                  รูปภาพประกอบข่าว ({galleryImages.length} รูป)
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.galleryScroll}
              >
                {galleryImages.map((imgUrl, index) => (
                  <Pressable
                    key={imgUrl + index}
                    onPress={() => {
                      setViewerInitialIndex(index);
                      setViewerVisible(true);
                    }}
                    style={[styles.galleryCard, { borderColor: colors.border }]}
                  >
                    <Image source={{ uri: imgUrl }} style={styles.galleryImage} resizeMode="cover" />
                    <View style={styles.galleryZoomIcon}>
                      <MaterialCommunityIcons name="magnify-plus-outline" size={14} color="#FFFFFF" />
                    </View>
                  </Pressable>
                ))}
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

          {/* ข่าวอื่นๆ ที่น่าสนใจ (Other / Related News Section) */}
          {otherArticles.length > 0 && (
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
                {otherArticles.map((item) => (
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

      {/* Full Screen Image Viewer Modal */}
      {galleryImages.length > 0 && (
        <ImageViewerModal
          visible={viewerVisible}
          images={galleryImages}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerVisible(false)}
        />
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
    paddingBottom: 56, // Clear margin so title and subtitle never collide with the curved sheet
    paddingHorizontal: 20,
    zIndex: 10,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
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
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.65)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '400',
    textShadowColor: 'rgba(0, 0, 0, 0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  /* 2. Overlapping Curved Sheet Card */
  sheetContainer: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    marginTop: -34,
    paddingHorizontal: 20,
    paddingTop: 22,
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

  /* 3. Photo Gallery Grid */
  gallerySection: {
    marginTop: 20,
  },
  galleryHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  galleryTitle: {
    fontWeight: '700',
  },
  galleryScroll: {
    gap: 10,
  },
  galleryCard: {
    borderRadius: 16,
    borderWidth: 1,
    height: 120,
    overflow: 'hidden',
    position: 'relative',
    width: 160,
  },
  galleryImage: {
    height: '100%',
    width: '100%',
  },
  galleryZoomIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 11,
    bottom: 6,
    height: 22,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    width: 22,
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
});
