import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNews } from '../../store/NewsContext';
import { NewsArticle } from '../../types';
import { getDiverseArticleImage } from '../../utils/articleVisuals';
import { sanitizeImageUrl } from '../../utils/content';

function cleanSource(raw?: string): string {
  if (!raw) return 'ข่าวด่วน';
  const name = raw.split('·')[0]?.trim() || '';
  if (name.includes('@')) {
    const lower = name.toLowerCase();
    if (lower.includes('thaipbs')) return 'Thai PBS';
    if (lower.includes('blognone')) return 'Blognone';
    if (lower.includes('droidsans')) return 'DroidSans';
    const domainPart = name.split('@')[1];
    if (domainPart) {
      const base = domainPart.split('.')[0];
      return base.charAt(0).toUpperCase() + base.slice(1);
    }
  }
  return name || 'ข่าวด่วน';
}

interface Props {
  articles: NewsArticle[];
  onPressArticle: (article: NewsArticle) => void;
}

export function FlashDispatchTicker({ articles, onPressArticle }: Props) {
  const { colors, scale, isDark } = useNews();
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollX = useRef(new Animated.Value(400)).current;
  const activeAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.35)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  const [, setContainerWidth] = useState(0);
  const containerWidthRef = useRef(0);
  const contentWidthRef = useRef(0);

  const validArticles = articles.filter((a) => a && a.title);

  // Live Breathing Pulse Animation on the FLASH badge
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.85,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.35,
            duration: 850,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, glowAnim]);

  const handleCardPressIn = () => {
    Animated.spring(cardScale, {
      toValue: 0.985,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPressOut = () => {
    Animated.spring(cardScale, {
      toValue: 1,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const startMarquee = useCallback((contentWidth: number, cWidth: number) => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
      activeAnimRef.current = null;
    }

    if (validArticles.length === 0 || cWidth <= 0 || contentWidth <= 0) return;

    // Start completely hidden to the right
    scrollX.setValue(cWidth);

    // Continuous TV Marquee: Image + Text travel from right edge to left exit
    const totalDistance = cWidth + contentWidth + 24;
    // Speed: 45 px/sec for crisp and legible pace
    const duration = (totalDistance / 45) * 1000;

    const anim = Animated.timing(scrollX, {
      toValue: -contentWidth - 24,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    });

    activeAnimRef.current = anim;
    anim.start(({ finished }) => {
      if (finished) {
        goToNext();
      }
    });
  }, [validArticles.length, scrollX]);

  const goToNext = useCallback(() => {
    if (validArticles.length <= 1) {
      if (contentWidthRef.current > 0 && containerWidthRef.current > 0) {
        startMarquee(contentWidthRef.current, containerWidthRef.current);
      }
      return;
    }
    setCurrentIndex((prev) => (prev + 1) % validArticles.length);
  }, [validArticles.length, startMarquee]);

  const goToPrev = useCallback(() => {
    if (validArticles.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + validArticles.length) % validArticles.length);
  }, [validArticles.length]);

  // When index changes, reset position and trigger marquee
  useEffect(() => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
      activeAnimRef.current = null;
    }

    if (containerWidthRef.current > 0) {
      scrollX.setValue(containerWidthRef.current);
    }

    const timer = setTimeout(() => {
      if (contentWidthRef.current > 0 && containerWidthRef.current > 0 && !activeAnimRef.current) {
        startMarquee(contentWidthRef.current, containerWidthRef.current);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (activeAnimRef.current) {
        activeAnimRef.current.stop();
      }
    };
  }, [currentIndex, startMarquee, scrollX]);

  const handleManualNext = () => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
    }
    goToNext();
  };

  const handleManualPrev = () => {
    if (activeAnimRef.current) {
      activeAnimRef.current.stop();
    }
    goToPrev();
  };

  if (validArticles.length === 0) return null;

  const currentArticle = validArticles[currentIndex];
  const sourceOrCategory = cleanSource(currentArticle.author);
  const thumbUri = sanitizeImageUrl(currentArticle.imageUrl) || getDiverseArticleImage(currentArticle);

  return (
    <Animated.View style={{ transform: [{ scale: cardScale }] }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? '#111827' : colors.surface,
            borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : 'rgba(239, 68, 68, 0.22)',
          },
        ]}
      >
        {/* 1. Left FLASH Kicker Pill with Live Breathing Pulse Glow */}
        <View style={styles.badgeWrap}>
          <Animated.View
            style={[
              styles.pillGlow,
              {
                opacity: glowAnim,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pillBadge}
            >
              <MaterialCommunityIcons name="lightning-bolt" size={11 * scale} color="#FFFFFF" style={{ marginRight: 2 }} />
              <Text style={[styles.pillBadgeText, { fontSize: 9.5 * scale }]}>FLASH</Text>
            </LinearGradient>
          </Animated.View>
        </View>

        {/* 2. Middle Content with Sliding News Image + Headline */}
        <Pressable
          onPress={() => onPressArticle(currentArticle)}
          onPressIn={handleCardPressIn}
          onPressOut={handleCardPressOut}
          style={styles.contentWrap}
        >
        <View style={styles.tickerRow}>
          {/* Static Source / Category Pill on the left */}
          <View style={[styles.categoryPill, { backgroundColor: colors.surfaceVariant }]}>
            <Text
              numberOfLines={1}
              style={[styles.categoryPillText, { color: colors.muted, fontSize: 10 * scale }]}
            >
              {sourceOrCategory}
            </Text>
          </View>

          {/* Marquee Window */}
          <View
            style={styles.textWindow}
            onLayout={(e: LayoutChangeEvent) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0) {
                containerWidthRef.current = w;
                setContainerWidth(w);
                if (contentWidthRef.current > 0) {
                  startMarquee(contentWidthRef.current, w);
                }
              }
            }}
          >
            <ScrollView
              horizontal
              scrollEnabled={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentContainer}
              pointerEvents="none"
            >
              <Animated.View
                style={[
                  styles.marqueeTrack,
                  {
                    transform: [{ translateX: scrollX }],
                  },
                ]}
                onLayout={(e: LayoutChangeEvent) => {
                  const w = e.nativeEvent.layout.width;
                  if (w > 0) {
                    contentWidthRef.current = w;
                    if (containerWidthRef.current > 0) {
                      startMarquee(w, containerWidthRef.current);
                    }
                  }
                }}
              >
                {/* News Thumbnail Image attached & sliding together with text */}
                <View style={[styles.thumbWrap, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                  {thumbUri ? (
                    <Image
                      source={{ uri: thumbUri }}
                      style={styles.thumbImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="newspaper-variant-outline"
                      size={13 * scale}
                      color={colors.primary}
                    />
                  )}
                </View>

                {/* Headline Text - Unconstrained in horizontal ScrollView so full headline renders without ... */}
                <Text
                  key={`flash-title-${currentArticle.id}-${currentIndex}`}
                  numberOfLines={1}
                  style={[
                    styles.headlineText,
                    { color: colors.text, fontSize: 12.5 * scale },
                  ]}
                >
                  {currentArticle.title}
                </Text>
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      </Pressable>

        {/* 3. Right Chevron Controls */}
        <View style={styles.controlsWrap}>
          <Pressable
            hitSlop={6}
            onPress={handleManualPrev}
            style={({ pressed }) => [styles.ctrlBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel="ข่าวด่วนก่อนหน้า"
          >
            <MaterialCommunityIcons name="chevron-left" size={16 * scale} color={colors.muted} />
          </Pressable>
          <Pressable
            hitSlop={6}
            onPress={handleManualNext}
            style={({ pressed }) => [styles.ctrlBtn, pressed && { opacity: 0.6 }]}
            accessibilityLabel="ข่าวด่วนถัดไป"
          >
            <MaterialCommunityIcons name="chevron-right" size={16 * scale} color={colors.muted} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 9,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeWrap: {
    position: 'relative',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillGlow: {
    position: 'absolute',
    top: -2,
    bottom: -2,
    left: -2,
    right: -2,
    borderRadius: 10,
    backgroundColor: '#EF4444',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  pillBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  contentWrap: {
    flex: 1,
    overflow: 'hidden',
    paddingRight: 6,
  },
  tickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 90,
  },
  categoryPillText: {
    fontWeight: '700',
  },
  textWindow: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  scrollContentContainer: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  marqueeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbWrap: {
    width: 22,
    height: 22,
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  headlineText: {
    fontWeight: '600',
    flexShrink: 0,
    includeFontPadding: false,
  },
  controlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ctrlBtn: {
    padding: 3,
  },
});
