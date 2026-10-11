import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
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
import { NewsArticle } from '../../types';
import { formatRelative, sanitizeImageUrl } from '../../utils/content';
import { getDiverseArticleImage } from '../../utils/articleVisuals';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SLIDER_WIDTH = SCREEN_WIDTH - 32;
const SLIDER_HEIGHT = 220;

interface Props {
  heroArticles: NewsArticle[];
  highlightArticles: NewsArticle[];
  onPressArticle: (article: NewsArticle) => void;
}

export function HeroShowcase({ heroArticles, highlightArticles, onPressArticle }: Props) {
  const { colors, scale } = useNews();
  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList<NewsArticle>>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

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

  const getImageUrl = (article: NewsArticle) => {
    if (imageErrors[article.id]) {
      return getDiverseArticleImage({ ...article, imageUrl: undefined });
    }
    return getDiverseArticleImage(article);
  };

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
              const kicker = item.author || 'ข่าวเด่นประจำวัน';
              const imgUri = getImageUrl(item);

              return (
                <Pressable
                  onPress={() => onPressArticle(item)}
                  style={[styles.slideCard, { width: SLIDER_WIDTH }]}
                >
                  <Image
                    source={{ uri: imgUri }}
                    style={styles.slideImage}
                    resizeMode="cover"
                    onError={() =>
                      setImageErrors((prev) => ({ ...prev, [item.id]: true }))
                    }
                  />

                  {/* Gradient Overlay */}
                  <LinearGradient
                    colors={['transparent', 'rgba(10, 14, 23, 0.55)', 'rgba(10, 14, 23, 0.95)']}
                    locations={[0, 0.45, 1]}
                    style={styles.gradientOverlay}
                  />

                  {/* Floating Content */}
                  <View style={styles.slideContent}>
                    {/* Vibrant Editorial Kicker Badge */}
                    <View style={styles.kickerPill}>
                      <Text style={[styles.kickerText, { fontSize: 10 * scale }]}>
                        {kicker}
                      </Text>
                    </View>

                    {/* Bold Title */}
                    <Text
                      numberOfLines={2}
                      style={[styles.slideTitle, { fontSize: 16.5 * scale }]}
                    >
                      {item.title}
                    </Text>

                    {/* Author & Timestamp */}
                    <View style={styles.metaRow}>
                      <MaterialCommunityIcons name="clock-outline" size={13 * scale} color="#94A3B8" />
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
                </Pressable>
              );
            }}
          />

          {/* Slider Dash / Indicator Bar */}
          {heroArticles.length > 1 && (
            <View style={styles.indicatorsRow}>
              {heroArticles.map((_, idx) => {
                const isActive = idx === activeSlide;
                return (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      sliderRef.current?.scrollToIndex({ index: idx, animated: true });
                      setActiveSlide(idx);
                    }}
                    style={[
                      styles.dashIndicator,
                      isActive ? styles.dashActive : styles.dashInactive,
                    ]}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* ================= 2. TRENDING HIGHLIGHTS GRID ================= */}
      {highlightArticles.length > 0 && (
        <View style={styles.highlightsContainer}>
          <View style={styles.highlightsHeader}>
            <View style={styles.highlightsHeaderLeft}>
              <MaterialCommunityIcons name="trending-up" size={16 * scale} color="#0EA5E9" />
              <Text style={[styles.highlightsHeading, { color: colors.text, fontSize: 13.5 * scale }]}>
                ประเด็นร้อนน่าสนใจ
              </Text>
            </View>
          </View>

          <View style={styles.highlightsList}>
            {highlightArticles.map((article) => {
              const imgUri = getImageUrl(article);
              const authorLabel = article.author?.split('·')[0]?.trim() || '';

              return (
                <Pressable
                  key={`hl-${article.id}`}
                  onPress={() => onPressArticle(article)}
                  style={({ pressed }) => [
                    styles.highlightItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: imgUri }}
                    style={styles.highlightThumb}
                    resizeMode="cover"
                    onError={() =>
                      setImageErrors((prev) => ({ ...prev, [article.id]: true }))
                    }
                  />
                  <View style={styles.highlightBody}>
                    {authorLabel ? (
                      <Text
                        numberOfLines={1}
                        style={[styles.highlightAuthor, { color: '#0EA5E9', fontSize: 10 * scale }]}
                      >
                        {authorLabel}
                      </Text>
                    ) : null}
                    <Text
                      numberOfLines={2}
                      style={[styles.highlightTitle, { color: colors.text, fontSize: 12 * scale }]}
                    >
                      {article.title}
                    </Text>
                    <Text style={[styles.highlightTime, { color: colors.muted, fontSize: 10.5 * scale }]}>
                      {article.publishedMillis ? formatRelative(article.publishedMillis) : 'ล่าสุด'}
                    </Text>
                  </View>
                </Pressable>
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
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
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
  kickerPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: 6,
  },
  kickerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.3,
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
    marginTop: 8,
  },
  dashIndicator: {
    height: 4,
    borderRadius: 2,
  },
  dashActive: {
    width: 22,
    backgroundColor: '#0EA5E9',
  },
  dashInactive: {
    width: 8,
    backgroundColor: 'rgba(148, 163, 184, 0.4)',
  },
  highlightsContainer: {
    marginTop: 4,
  },
  highlightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  highlightsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  highlightsHeading: {
    fontWeight: '800',
  },
  highlightsList: {
    gap: 8,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  highlightThumb: {
    width: 66,
    height: 66,
    borderRadius: 8,
  },
  highlightBody: {
    flex: 1,
    justifyContent: 'center',
  },
  highlightAuthor: {
    fontWeight: '700',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  highlightTitle: {
    fontWeight: '700',
    lineHeight: 16,
    marginBottom: 4,
  },
  highlightTime: {
    fontWeight: '500',
  },
});
