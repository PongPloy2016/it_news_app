import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNews } from '../../store/NewsContext';
import { NewsArticle } from '../../types';
import { formatRelative } from '../../utils/content';

interface Props {
  articles: NewsArticle[];
  onPressArticle: (article: NewsArticle) => void;
}

export function FlashDispatchTicker({ articles, onPressArticle }: Props) {
  const { colors, scale } = useNews();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const validArticles = articles.filter((a) => a && a.title);

  useEffect(() => {
    if (validArticles.length <= 1) return;

    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, [validArticles.length, currentIndex]);

  const changeSlide = (nextIndex: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentIndex(nextIndex);
  };

  const handleNext = () => {
    if (validArticles.length === 0) return;
    const next = (currentIndex + 1) % validArticles.length;
    changeSlide(next);
  };

  const handlePrev = () => {
    if (validArticles.length === 0) return;
    const prev = (currentIndex - 1 + validArticles.length) % validArticles.length;
    changeSlide(prev);
  };

  if (validArticles.length === 0) return null;

  const currentArticle = validArticles[currentIndex];
  const sourceOrCategory = currentArticle.author?.split('·')[0]?.trim() || 'ข่าวด่วน';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* 1. Left Kicker Pill */}
      <View style={styles.pillBadge}>
        <MaterialCommunityIcons name="flash" size={12 * scale} color="#FFFFFF" style={{ marginRight: 2 }} />
        <Text style={[styles.pillBadgeText, { fontSize: 10 * scale }]}>FLASH</Text>
      </View>

      {/* 2. Middle Content with fade animation */}
      <Pressable
        onPress={() => onPressArticle(currentArticle)}
        style={styles.contentWrap}
      >
        <Animated.View style={[styles.animatedContent, { opacity: fadeAnim }]}>
          <View style={[styles.categoryPill, { backgroundColor: colors.surfaceVariant }]}>
            <Text
              numberOfLines={1}
              style={[styles.categoryPillText, { color: colors.muted, fontSize: 10 * scale }]}
            >
              {sourceOrCategory}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.headlineText, { color: colors.text, fontSize: 12.5 * scale }]}
          >
            {currentArticle.title}
          </Text>
        </Animated.View>
      </Pressable>

      {/* 3. Right Chevron Controls */}
      <View style={styles.controlsWrap}>
        <Pressable
          hitSlop={6}
          onPress={handlePrev}
          style={({ pressed }) => [styles.ctrlBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={16 * scale} color={colors.muted} />
        </Pressable>
        <Pressable
          hitSlop={6}
          onPress={handleNext}
          style={({ pressed }) => [styles.ctrlBtn, pressed && { opacity: 0.6 }]}
        >
          <MaterialCommunityIcons name="chevron-right" size={16 * scale} color={colors.muted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
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
  animatedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  headlineText: {
    flex: 1,
    fontWeight: '600',
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
