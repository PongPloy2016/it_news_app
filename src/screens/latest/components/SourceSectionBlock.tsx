import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FeedSource } from '../../../config';
import { useNews } from '../../../store/NewsContext';
import { NewsArticle } from '../../../types';
import { formatRelative, sanitizeImageUrl } from '../../../utils/content';
import { getDiverseArticleImage } from '../../../utils/articleVisuals';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP) / 2;

interface SourceSectionBlockProps {
  source: FeedSource;
  articles: NewsArticle[];
  accentColor?: string;
  onPressArticle: (
    article: NewsArticle,
    categoryArticles?: NewsArticle[],
    groupKey?: string,
    groupLabel?: string,
  ) => void;
  onViewAll: (sourceKey: string) => void;
}

export function SourceSectionBlock({
  source,
  articles,
  accentColor = '#0EA5E9',
  onPressArticle,
  onViewAll,
}: SourceSectionBlockProps) {
  const { colors, scale, bookmarks, toggleBookmark, isDark } = useNews();
  const [imageErrors, setImageErrors] = useState<Record<string, number>>({});

  const displayArticles = articles.slice(0, 4);
  const remainingCount = Math.max(0, articles.length - 4);

  if (displayArticles.length === 0) return null;

  const getImageUrl = (article: NewsArticle) => {
    const errorCount = imageErrors[article.id] || 0;
    if (errorCount === 0) {
      const direct = sanitizeImageUrl(article.imageUrl);
      if (direct) return direct;
    }
    return getDiverseArticleImage(article, undefined, errorCount);
  };

  return (
    <View style={[styles.sectionContainer, { borderBottomColor: colors.border }]}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={[styles.sourceIconBadge, { backgroundColor: `${accentColor}1A` }]}>
            <MaterialCommunityIcons name="rss" size={15 * scale} color={accentColor} />
          </View>
          <Text
            numberOfLines={1}
            style={[styles.sourceTitle, { color: colors.text, fontSize: 16 * scale }]}
          >
            {source.label}
          </Text>
          <View style={[styles.countBadge, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
            <Text style={[styles.countText, { color: colors.muted, fontSize: 11 * scale }]}>
              {articles.length} ข่าว
            </Text>
          </View>
        </View>

        {/* View All Button */}
        <Pressable
          onPress={() => onViewAll(source.key)}
          style={({ pressed }) => [
            styles.viewAllBtn,
            {
              backgroundColor: pressed ? `${accentColor}25` : `${accentColor}14`,
              borderColor: `${accentColor}40`,
            },
          ]}
          hitSlop={6}
          accessibilityLabel={`ดูข่าวทั้งหมดจาก ${source.label}`}
        >
          <Text style={[styles.viewAllText, { color: accentColor, fontSize: 12 * scale }]}>
            ดูทั้งหมด
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={15 * scale} color={accentColor} />
        </Pressable>
      </View>

      {/* 2-Column Grid Cards */}
      <View style={styles.gridContainer}>
        {displayArticles.map((article) => {
          const isBookmarked = Boolean(bookmarks[article.id]);
          const imageUrl = getImageUrl(article);

          return (
            <Pressable
              key={article.id}
              onPress={() => onPressArticle(article, articles)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
              ]}
            >
              {/* Thumbnail with overlay gradient */}
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.cardImage}
                  resizeMode="cover"
                  onError={() => {
                    setImageErrors((prev) => ({
                      ...prev,
                      [article.id]: (prev[article.id] || 0) + 1,
                    }));
                  }}
                />
              </View>

              {/* Card Content */}
              <View style={styles.cardBody}>
                <Text
                  numberOfLines={2}
                  style={[styles.cardTitle, { color: colors.text, fontSize: 13 * scale }]}
                >
                  {article.title}
                </Text>

                <View style={styles.cardFooter}>
                  <Text
                    numberOfLines={1}
                    style={[styles.timeText, { color: colors.muted, fontSize: 11 * scale }]}
                  >
                    {formatRelative(article.publishedMillis || Date.now())}
                  </Text>

                  <Pressable
                    hitSlop={8}
                    onPress={() => toggleBookmark(article)}
                    style={styles.bookmarkBtn}
                    accessibilityLabel={isBookmarked ? 'ยกเลิกบุ๊กมาร์ก' : 'บุ๊กมาร์กข่าวนี้'}
                  >
                    <MaterialCommunityIcons
                      name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                      size={17 * scale}
                      color={isBookmarked ? accentColor : colors.muted}
                    />
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Bottom Link to View All from Source */}
      {remainingCount > 0 && (
        <Pressable
          onPress={() => onViewAll(source.key)}
          style={({ pressed }) => [
            styles.bottomViewMoreBtn,
            {
              backgroundColor: isDark ? '#162032' : '#F8FAFC',
              borderColor: colors.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={[styles.bottomViewMoreText, { color: accentColor, fontSize: 12.5 * scale }]}>
            ดูข่าวจาก {source.label} อีก {remainingCount} ข่าว
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={14 * scale} color={accentColor} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  sourceIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    fontWeight: '700',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  viewAllText: {
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  imageWrap: {
    width: '100%',
    height: 98,
    backgroundColor: '#1E293B',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardBody: {
    padding: 9,
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 78,
  },
  cardTitle: {
    fontWeight: '700',
    lineHeight: 18,
    marginBottom: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  timeText: {
    fontWeight: '500',
  },
  bookmarkBtn: {
    padding: 2,
  },
  bottomViewMoreBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  bottomViewMoreText: {
    fontWeight: '700',
  },
});
