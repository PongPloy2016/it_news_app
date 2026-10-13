import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FeedGroup } from '../../config/categories';
import { getCategoryVisual } from '../../config/categoryVisuals';
import { useNews } from '../../store/NewsContext';
import { NewsArticle } from '../../types';
import { formatRelative, sanitizeImageUrl } from '../../utils/content';
import { getDiverseArticleImage } from '../../utils/articleVisuals';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP) / 2;

interface Props {
  group: FeedGroup;
  articles: NewsArticle[];
  onPressArticle: (article: NewsArticle) => void;
  onViewAll: (groupKey: string) => void;
}

export function CategorySectionBlock({
  group,
  articles,
  onPressArticle,
  onViewAll,
}: Props) {
  const { colors, scale, bookmarks, toggleBookmark } = useNews();
  const visual = getCategoryVisual(group.key, group.label, group.color);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const displayArticles = articles.slice(0, 4);
  if (displayArticles.length === 0) return null;

  const getImageUrl = (article: NewsArticle) => {
    if (imageErrors[article.id]) {
      return getDiverseArticleImage({ ...article, imageUrl: undefined }, group.key);
    }
    return getDiverseArticleImage(article, group.key);
  };

  const getEnglishBadgeText = (key: string): string => {
    switch (key) {
      case 'tech-business':
        return 'TECH & BUSINESS';
      case 'international':
        return 'GLOBAL IT';
      case 'thai-news':
        return 'THAI NEWS';
      case 'mobile':
        return 'MOBILE & GADGETS';
      case 'computer-games':
        return 'PC & GAMING';
      case 'weather-forecast':
        return 'WEATHER';
      case 'cybersecurity':
        return 'CYBER SECURITY';
      case 'agriculture':
        return 'AGRICULTURE';
      case 'ai-innovation':
        return 'AI & INNOVATION';
      case 'ev-vehicles':
        return 'EV & TECH';
      default:
        return 'TECH NEWS';
    }
  };

  return (
    <View style={styles.container}>
      {/* ================= 1. SECTION HEADER BAR ================= */}
      <View style={[styles.headerBar, { borderLeftColor: group.color }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.categoryBadge, { backgroundColor: group.color }]}>
            <MaterialCommunityIcons
              name={visual.icon}
              size={11 * scale}
              color="#FFFFFF"
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.categoryBadgeText, { fontSize: 9.5 * scale }]}>
              {getEnglishBadgeText(group.key)}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.categoryTitle, { color: colors.text, fontSize: 15 * scale }]}
          >
            {group.label}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.countText, { color: colors.muted, fontSize: 10 * scale }]}>
              {articles.length} ข่าว
            </Text>
          </View>
        </View>

        <Pressable
          hitSlop={8}
          onPress={() => onViewAll(group.key)}
          style={({ pressed }) => [
            styles.viewAllBtn,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={[styles.viewAllText, { color: group.color, fontSize: 11.5 * scale }]}>
            ดูทั้งหมด
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={15 * scale} color={group.color} />
        </Pressable>
      </View>

      {/* ================= 2. 2x2 CARDS GRID ================= */}
      <View style={styles.grid}>
        {displayArticles.map((article, idx) => {
          const imgUri = getImageUrl(article);
          const isBookmarked = Boolean(bookmarks[article.id]);
          const sourceLabel = article.author?.split('·')[0]?.trim() || visual.shortLabel;

          return (
            <Pressable
              key={`cat-card-${group.key}-${article.id}-${idx}`}
              onPress={() => onPressArticle(article)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              {/* Card Thumbnail Wrap with Badges */}
              <View style={styles.mediaWrap}>
                <Image
                  source={{ uri: imgUri }}
                  style={styles.cardImage}
                  resizeMode="cover"
                  onError={() =>
                    setImageErrors((prev) => ({ ...prev, [article.id]: true }))
                  }
                />
                {/* Floating Category Pill */}
                <View style={[styles.floatingPill, { backgroundColor: group.color }]}>
                  <Text numberOfLines={1} style={[styles.floatingPillText, { fontSize: 8.5 * scale }]}>
                    {visual.shortLabel}
                  </Text>
                </View>
                {/* Source Badge */}
                <View style={styles.floatingSource}>
                  <Text numberOfLines={1} style={[styles.floatingSourceText, { fontSize: 8.5 * scale }]}>
                    {sourceLabel}
                  </Text>
                </View>
              </View>

              {/* Card Body */}
              <View style={styles.cardBody}>
                <Text
                  numberOfLines={2}
                  style={[styles.cardTitle, { color: colors.text, fontSize: 12.5 * scale }]}
                >
                  {article.title}
                </Text>

                <View style={styles.cardFooter}>
                  <Text
                    numberOfLines={1}
                    style={[styles.cardTime, { color: colors.muted, fontSize: 10 * scale }]}
                  >
                    {article.publishedMillis ? formatRelative(article.publishedMillis) : 'ล่าสุด'}
                  </Text>
                  <Pressable
                    hitSlop={6}
                    onPress={() => toggleBookmark(article)}
                    style={styles.bookmarkIconBtn}
                  >
                    <MaterialCommunityIcons
                      name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={14 * scale}
                      color={isBookmarked ? group.color : colors.muted}
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    borderLeftWidth: 3,
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  categoryTitle: {
    fontWeight: '800',
    flexShrink: 1,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  countText: {
    fontWeight: '600',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
  },
  viewAllText: {
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mediaWrap: {
    width: '100%',
    height: 105,
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  floatingPill: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 90,
  },
  floatingPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  floatingSource: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 80,
  },
  floatingSourceText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  cardBody: {
    padding: 8,
    justifyContent: 'space-between',
    minHeight: 68,
  },
  cardTitle: {
    fontWeight: '700',
    lineHeight: 16.5,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTime: {
    fontWeight: '500',
    flex: 1,
  },
  bookmarkIconBtn: {
    padding: 2,
  },
});
