import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNews } from '../../store/NewsContext';
import { getCategoryVisual } from '../../config/categoryVisuals';
import { NewsArticle } from '../../types';
import { formatRelative, formatThaiDate, sanitizeImageUrl } from '../../utils/content';
import { getDiverseArticleImage } from '../../utils/articleVisuals';


const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - 32;
const SLIDER_HEIGHT = 240;

function cleanAuthorDisplayName(rawAuthor?: string): string {
  if (!rawAuthor) return '';
  const name = rawAuthor.split('·')[0]?.trim() || '';
  if (name.includes('@')) {
    const lower = name.toLowerCase();
    if (lower.includes('thaipbs')) return 'Thai PBS';
    if (lower.includes('blognone')) return 'Blognone';
    if (lower.includes('droidsans')) return 'DroidSans';
    if (lower.includes('brandinside')) return 'Brand Inside';
    if (lower.includes('marketingoops')) return 'MarketingOops';
    const domainPart = name.split('@')[1];
    if (domainPart) {
      const mainName = domainPart.split('.')[0];
      return mainName.charAt(0).toUpperCase() + mainName.slice(1);
    }
  }
  return name;
}

interface Props {
  heroArticles: NewsArticle[];
  highlightArticles: NewsArticle[];
  onPressArticle: (
    article: NewsArticle,
    customArticles?: NewsArticle[],
    categoryKey?: string,
    categoryLabel?: string,
  ) => void;
}

function HeroCardPressable({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.982,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

function AnimatedIndicatorDot({
  isActive,
  onPress,
  styles,
}: {
  isActive: boolean;
  onPress: () => void;
  styles: any;
}) {
  const widthAnim = useRef(new Animated.Value(isActive ? 26 : 6)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isActive ? 26 : 6,
      friction: 7,
      tension: 90,
      useNativeDriver: false,
    }).start();
  }, [isActive, widthAnim]);

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <Animated.View
        style={[
          styles.dashIndicator,
          isActive ? styles.dashActive : styles.dashInactive,
          { width: widthAnim },
        ]}
      />
    </Pressable>
  );
}

function AnimatedHighlightCard({
  children,
  onPress,
  style,
  index,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
  index: number;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    const delay = Math.min(index * 60, 360);
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [fadeAnim, translateY, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.975,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }, { scale: scaleAnim }],
      }}
    >
      <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} style={style}>
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function HeroShowcase({ heroArticles, highlightArticles, onPressArticle }: Props) {
  const { colors, scale, isDark, feedGroups } = useNews();
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList<NewsArticle>>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});

  useEffect(() => {
    if (heroArticles.length <= 1) return;

    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % heroArticles.length;
        sliderRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 5500);

    return () => clearInterval(timer);
  }, [heroArticles.length]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SLIDER_WIDTH);
    if (slideIndex !== activeSlide && slideIndex >= 0 && slideIndex < heroArticles.length) {
      setActiveSlide(slideIndex);
    }
  };

  const getArticleCategoryInfo = (article: NewsArticle) => {
    // 1. Try matching author to active feedGroups from settings
    if (article.author) {
      const authorLower = article.author.toLowerCase();
      const matched = feedGroups.find((g) =>
        g.sources.some(
          (s) =>
            authorLower.includes(s.label.toLowerCase()) ||
            s.label.toLowerCase().includes(authorLower) ||
            (s.key && authorLower.includes(s.key.toLowerCase())),
        ),
      );
      if (matched) {
        const visual = getCategoryVisual(matched.key, matched.label, matched.color);
        return {
          key: matched.key,
          label: matched.label.replace(/^ข่าว/, '').trim(),
          color: matched.color || visual.color,
          icon: visual.icon,
        };
      }
    }

    // 2. Try matching article link domain to feedGroups sources
    if (article.link) {
      try {
        const articleHost = new URL(article.link).hostname.toLowerCase().replace(/^www\./, '');
        const matched = feedGroups.find((g) =>
          g.sources.some((s) => {
            if (!s.homepage && !s.url) return false;
            try {
              const srcHost = new URL(s.homepage || s.url).hostname.toLowerCase().replace(/^www\./, '');
              return articleHost.includes(srcHost) || srcHost.includes(articleHost);
            } catch {
              return false;
            }
          }),
        );
        if (matched) {
          const visual = getCategoryVisual(matched.key, matched.label, matched.color);
          return {
            key: matched.key,
            label: matched.label.replace(/^ข่าว/, '').trim(),
            color: matched.color || visual.color,
            icon: visual.icon,
          };
        }
      } catch {}
    }

    // 3. Fallback: ONLY match against groups that actually exist in the user's active feedGroups setting
    const textToScan = `${article.title} ${article.description || ''}`.toLowerCase();
    const groupKeys = new Set(feedGroups.map((g) => g.key));

    let detectedKey: string | null = null;
    if (groupKeys.has('mobile') && /มือถือ|phone|oneui|samsung|apple|iphone|ipad|android|xiaomi|oppo|vivo/i.test(textToScan)) {
      detectedKey = 'mobile';
    } else if (groupKeys.has('developer-coding') && /โปรแกรมมิ่ง|developer|coding|github|open source|linux|api|code|typescript|python/i.test(textToScan)) {
      detectedKey = 'developer-coding';
    } else if (groupKeys.has('fintech-crypto') && /บิตคอยน์|bitcoin|crypto|คริปโท|blockchain|fintech|การเงิน|หุ้น|สินทรัพย์/i.test(textToScan)) {
      detectedKey = 'fintech-crypto';
    } else if (groupKeys.has('weather-forecast') && /ฝน|น้ำท่วม|พายุ|อากาศ|pm2\.5|tmd|สภาพอากาศ/i.test(textToScan)) {
      detectedKey = 'weather-forecast';
    } else if (groupKeys.has('agriculture') && /เกษตร|ชาวนา|พืช|ปศุสัตว์|ข้าว|เพาะปลูก/i.test(textToScan)) {
      detectedKey = 'agriculture';
    } else if (groupKeys.has('education') && /การศึกษา|โรงเรียน|มหาวิทยาลัย|ครู|นักเรียน|สอบ|ทุนการศึกษา/i.test(textToScan)) {
      detectedKey = 'education';
    } else if (groupKeys.has('international') && /ต่างประเทศ|global|us|china|eu|japan/i.test(textToScan)) {
      detectedKey = 'international';
    } else if (groupKeys.has('thai-news') && /ไทย|กทม|รัฐบาล|สำนักข่าว/i.test(textToScan)) {
      detectedKey = 'thai-news';
    }

    const fallbackGroup = feedGroups[0] || {
      key: 'tech-business',
      label: 'เทคโนโลยีและธุรกิจดิจิทัล',
      color: '#2F6FED',
    };
    const finalGroup = (detectedKey && feedGroups.find((g) => g.key === detectedKey)) || fallbackGroup;
    const visual = getCategoryVisual(finalGroup.key, finalGroup.label, finalGroup.color);

    return {
      key: finalGroup.key,
      label: finalGroup.label.replace(/^ข่าว/, '').trim(),
      color: finalGroup.color || visual.color,
      icon: visual.icon,
    };
  };

  const resolveCategoryKey = (article: NewsArticle): string => {
    return getArticleCategoryInfo(article).key;
  };

  const getImageUrl = (article: NewsArticle) => {
    const errorCount = imageErrors[article.id] || 0;
    if (errorCount === 0) {
      const direct = sanitizeImageUrl(article.imageUrl);
      if (direct) return direct;
    }
    const catKey = resolveCategoryKey(article);
    return getDiverseArticleImage(article, catKey, errorCount);
  };

  const heroArticlesWithImages = useMemo(
    () =>
      heroArticles.map((a) => {
        const errorCount = imageErrors[a.id] || 0;
        const direct = sanitizeImageUrl(a.imageUrl);
        const imgUri = direct || getDiverseArticleImage(a, resolveCategoryKey(a), errorCount);
        return {
          ...a,
          imageUrl: a.imageUrl || imgUri,
        };
      }),
    [heroArticles, imageErrors, feedGroups],
  );

  const highlightArticlesWithImages = useMemo(
    () =>
      highlightArticles.map((a) => {
        const errorCount = imageErrors[a.id] || 0;
        const direct = sanitizeImageUrl(a.imageUrl);
        const imgUri = direct || getDiverseArticleImage(a, resolveCategoryKey(a), errorCount);
        return {
          ...a,
          imageUrl: a.imageUrl || imgUri,
        };
      }),
    [highlightArticles, imageErrors, feedGroups],
  );

  if (heroArticles.length === 0 && highlightArticles.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* ================= 1. HERO SLIDER CAROUSEL ================= */}
      {heroArticles.length > 0 && (
        <View style={styles.sliderWrapper}>
          <FlatList
            ref={sliderRef}
            data={heroArticles}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
            keyExtractor={(item) => `hero-${item.id}`}
            getItemLayout={(_, index) => ({
              length: SLIDER_WIDTH,
              offset: SLIDER_WIDTH * index,
              index,
            })}
            renderItem={({ item }) => {
              const itemCat = getArticleCategoryInfo(item);
              const authorLabel = cleanAuthorDisplayName(item.author);
              const imgUri = getImageUrl(item);
              const hasPermanentError = (imageErrors[item.id] || 0) >= 3;

              return (
                <HeroCardPressable
                  onPress={() =>
                    onPressArticle(
                      { ...item, imageUrl: item.imageUrl || imgUri },
                      heroArticlesWithImages,
                      'hero',
                      'ข่าวเด่นประจำวัน',
                    )
                  }
                  style={[
                    styles.slideCard,
                    { width: SLIDER_WIDTH, backgroundColor: colors.surfaceVariant },
                  ]}
                >
                  {hasPermanentError ? (
                    <View style={[styles.slideImage, styles.fallbackHeroWrap, { backgroundColor: colors.surfaceVariant }]}>
                      <MaterialCommunityIcons name="newspaper-variant-outline" size={44 * scale} color={colors.muted} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: imgUri }}
                      style={styles.slideImage}
                      resizeMode="cover"
                      onError={() =>
                        setImageErrors((prev) => ({
                          ...prev,
                          [item.id]: (prev[item.id] || 0) + 1,
                        }))
                      }
                    />
                  )}

                  {/* Gradient Overlay for high-contrast headline readability */}
                  <LinearGradient
                    colors={['transparent', 'rgba(10, 14, 23, 0.35)', 'rgba(10, 14, 23, 0.78)', 'rgba(10, 14, 23, 0.96)']}
                    locations={[0, 0.32, 0.65, 1]}
                    style={styles.gradientOverlay}
                  />

                  {/* Top Slide Counter Badge */}
                  {heroArticles.length > 1 && (
                    <View style={styles.topSlideBadge}>
                      <MaterialCommunityIcons name="lightning-bolt" size={11 * scale} color="#FDE047" />
                      <Text style={[styles.topSlideBadgeText, { fontSize: 10 * scale }]}>
                        ข่าวเด่น {activeSlide + 1}/{heroArticles.length}
                      </Text>
                    </View>
                  )}

                  {/* Floating Content */}
                  <View style={styles.slideContent}>
                    {/* Sub-Category Badge + Source Pill */}
                    <View style={styles.slideBadgesRow}>
                      <View style={[styles.subCategoryBadge, { backgroundColor: itemCat.color }]}>
                        <MaterialCommunityIcons
                          name={itemCat.icon}
                          size={10.5 * scale}
                          color="#FFFFFF"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={[styles.subCategoryBadgeText, { fontSize: 9.5 * scale }]}>
                          {itemCat.label}
                        </Text>
                      </View>

                      {authorLabel ? (
                        <View style={styles.kickerPill}>
                          <Text style={[styles.kickerText, { fontSize: 9.5 * scale }]}>
                            {authorLabel}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Bold Title */}
                    <Text
                      numberOfLines={3}
                      style={[styles.slideTitle, { fontSize: 16.5 * scale }]}
                    >
                      {item.title}
                    </Text>

                    {/* Author & Timestamp */}
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="calendar-outline" size={12 * scale} color="#94A3B8" />
                      <Text style={[styles.metaTime, { fontSize: 11 * scale }]}>
                        {item.publishedMillis ? formatThaiDate(item.publishedMillis, { shortYear: true }) : 'วันนี้'}
                      </Text>
                      <Text style={styles.metaDot}>•</Text>
                      <MaterialCommunityIcons name="clock-outline" size={12 * scale} color="#94A3B8" />
                      <Text style={[styles.metaTime, { fontSize: 11 * scale }]}>
                        {item.publishedMillis ? formatRelative(item.publishedMillis) : 'ล่าสุด'}
                      </Text>
                      {item.readingTime ? (
                        <>
                          <Text style={styles.metaDot}>•</Text>
                          <Text style={[styles.metaTime, { fontSize: 11 * scale }]}>
                            อ่าน {item.readingTime} นาที
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>
                </HeroCardPressable>
              );
            }}
          />

          {/* Slider Dash / Indicator Bar */}
          {heroArticles.length > 1 && (
            <View style={styles.indicatorsRow}>
              {heroArticles.map((_, idx) => (
                <AnimatedIndicatorDot
                  key={`dot-${idx}`}
                  isActive={idx === activeSlide}
                  onPress={() => {
                    sliderRef.current?.scrollToIndex({ index: idx, animated: true });
                    setActiveSlide(idx);
                  }}
                  styles={styles}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* ================= 2. TRENDING HIGHLIGHTS GRID ================= */}
      {highlightArticles.length > 0 && (
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightsHeader}>
            <View style={styles.highlightsHeaderLeft}>
              <MaterialCommunityIcons name="trending-up" size={18 * scale} color="#0EA5E9" />
              <Text style={[styles.highlightsHeading, { color: isDark ? '#38BDF8' : '#0284C7', fontSize: 16.5 * scale }]}>
                ประเด็นร้อนน่าสนใจ
              </Text>
            </View>
            <View style={[styles.highlightsCountBadge, { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.08)' }]}>
              <Text style={[styles.highlightsCountText, { fontSize: 11 * scale }]}>
                {highlightArticles.length} ข่าวฮิต
              </Text>
            </View>
          </View>

          <View style={styles.highlightsList}>
            {highlightArticles.map((article, idx) => {
              const imgUri = getImageUrl(article);
              const articleCat = getArticleCategoryInfo(article);
              const authorLabel = cleanAuthorDisplayName(article.author);

              return (
                <AnimatedHighlightCard
                  key={`hl-${article.id}-${idx}`}
                  index={idx}
                  onPress={() =>
                    onPressArticle(
                      { ...article, imageUrl: article.imageUrl || imgUri },
                      highlightArticlesWithImages,
                      'trending',
                      'ประเด็นร้อนน่าสนใจ',
                    )
                  }
                  style={[
                    styles.highlightItem,
                    {
                      backgroundColor: isDark ? '#131D31' : colors.surface,
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                    },
                  ]}
                >
                  <View style={styles.highlightBody}>
                    <Text
                      numberOfLines={3}
                      style={[styles.highlightTitle, { color: colors.text, fontSize: 13.5 * scale }]}
                    >
                      {article.title}
                    </Text>

                    <View style={styles.highlightMetaRow}>
                      <View style={[styles.highlightSubBadge, { backgroundColor: articleCat.color }]}>
                        <MaterialCommunityIcons
                          name={articleCat.icon}
                          size={9 * scale}
                          color="#FFFFFF"
                          style={{ marginRight: 3 }}
                        />
                        <Text style={[styles.highlightSubBadgeText, { fontSize: 9 * scale }]}>
                          {articleCat.label}
                        </Text>
                      </View>

                      {authorLabel ? (
                        <>
                          <Text style={[styles.highlightDot, { color: colors.muted }]}>•</Text>
                          <Text
                            numberOfLines={1}
                            style={[styles.highlightAuthor, { color: colors.muted, fontSize: 9.5 * scale }]}
                          >
                            {authorLabel}
                          </Text>
                        </>
                      ) : null}

                      {article.publishedMillis ? (
                        <>
                          <Text style={[styles.highlightDot, { color: colors.muted }]}>•</Text>
                          <Text
                            numberOfLines={1}
                            style={[styles.highlightTime, { color: colors.muted, fontSize: 9.5 * scale }]}
                          >
                            {formatRelative(article.publishedMillis)}
                          </Text>
                        </>
                      ) : null}
                    </View>
                  </View>

                  {(imageErrors[article.id] || 0) >= 3 ? (
                    <View style={[styles.highlightThumb, styles.highlightFallbackWrap, { backgroundColor: colors.surfaceVariant }]}>
                      <MaterialCommunityIcons name="newspaper-variant-outline" size={24 * scale} color={colors.primary} />
                    </View>
                  ) : (
                    <View style={[styles.highlightThumb, { backgroundColor: colors.surfaceVariant, overflow: 'hidden' }]}>
                      <Image
                        source={{ uri: imgUri }}
                        style={styles.highlightThumb}
                        resizeMode="cover"
                        onError={() =>
                          setImageErrors((prev) => ({
                            ...prev,
                            [article.id]: (prev[article.id] || 0) + 1,
                          }))
                        }
                      />
                    </View>
                  )}

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={18 * scale}
                    color={isDark ? '#475569' : '#CBD5E1'}
                    style={styles.highlightChevron}
                  />
                </AnimatedHighlightCard>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sliderWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  slideCard: {
    height: SLIDER_HEIGHT,
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slideImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  slideContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  slideBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  subCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  subCategoryBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  kickerPill: {
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  kickerText: {
    color: '#E2E8F0',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  slideTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    lineHeight: 22,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaTime: {
    color: '#CBD5E1',
    fontWeight: '500',
  },
  metaDot: {
    color: '#64748B',
    marginHorizontal: 3,
  },
  indicatorsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 4,
  },
  dashIndicator: {
    height: 6,
    borderRadius: 999,
  },
  dashActive: {
    width: 26,
    backgroundColor: '#0EA5E9',
  },
  dashInactive: {
    width: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.28)',
  },
  highlightsContainer: {
    marginTop: 8,
  },
  highlightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  highlightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightsHeading: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  highlightsList: {
    gap: 10,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  highlightThumb: {
    width: 68,
    height: 68,
    borderRadius: 14,
  },
  highlightBody: {
    flex: 1,
    justifyContent: 'center',
  },
  highlightTitle: {
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  highlightMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
  },
  highlightSubBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  highlightSubBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  highlightAuthor: {
    fontWeight: '600',
    maxWidth: 90,
  },
  highlightTime: {
    fontWeight: '500',
  },
  highlightDot: {
    marginHorizontal: 2,
    fontSize: 9,
  },
  highlightChevron: {
    marginLeft: -2,
  },
  topSlideBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 10,
  },
  topSlideBadgeText: {
    color: '#F8FAFC',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  highlightsCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.35)',
  },
  highlightsCountText: {
    color: '#0EA5E9',
    fontWeight: '800',
  },
  fallbackHeroWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightFallbackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
