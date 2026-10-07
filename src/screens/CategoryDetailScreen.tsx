import { MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsCard } from '../components/NewsCard';
import { SkeletonFeed } from '../components/SkeletonCard';
import { CustomRefreshHeader } from '../components/CustomRefreshIndicator';
import { getCategoryVisual } from '../config/categoryVisuals';
import { FeedSource } from '../config/feeds';
import { feedService } from '../services/feedService';
import { showInterstitialAndNavigate } from '../services/interstitialService';
import { useNews } from '../store/NewsContext';
import { NewsArticle, RootStackParamList } from '../types';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type ScreenRouteProp = RouteProp<RootStackParamList, 'CategoryDetail'>;

export function CategoryDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { groupKey } = route.params;

  const {
    feedGroups,
    colors,
    scale,
    isDark,
    bookmarks,
    toggleBookmark,
    setSelectedFeedKey,
    selectedFeedKey,
    channelStats,
    settings,
  } = useNews();

  const currentGroup = useMemo(() => {
    return feedGroups.find((g) => g.key === groupKey) ?? feedGroups[0];
  }, [feedGroups, groupKey]);

  const visual = useMemo(() => {
    return getCategoryVisual(currentGroup?.key ?? groupKey, currentGroup?.label, currentGroup?.color);
  }, [currentGroup, groupKey]);

  const sources = useMemo(() => {
    return currentGroup?.sources ?? [];
  }, [currentGroup]);

  // Selected sub-source within this category (null means all sources in group)
  const [selectedSourceKey, setSelectedSourceKey] = useState<string>('all');
  const [categoryArticles, setCategoryArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Load articles for the selected source or entire group
  const loadArticles = async (sourceKey: string, force = false) => {
    if (!currentGroup) return;
    try {
      let targetSource: FeedSource | undefined;
      if (sourceKey === 'all') {
        targetSource = sources.find((s) => s.type === 'aggregate') || {
          key: `all:${currentGroup.key}`,
          label: `รวมข่าว${visual.shortLabel}`,
          url: `aggregate://${currentGroup.key}`,
          homepage: 'https://techthainews.app',
          type: 'aggregate',
        };
      } else {
        targetSource = sources.find((s) => s.key === sourceKey);
      }

      if (targetSource) {
        const fetched = await feedService.fetchFeed(targetSource, 1);
        setCategoryArticles(fetched);
      }
    } catch (err) {
      console.warn('[CategoryDetailScreen] Failed to load articles:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    void loadArticles(selectedSourceKey);
  }, [selectedSourceKey, currentGroup?.key]);

  const onRefresh = () => {
    setIsRefreshing(true);
    void loadArticles(selectedSourceKey, true);
  };

  const handleOpenArticle = (article: NewsArticle) => {
    feedService.registerArticles([article]);
    showInterstitialAndNavigate(() => {
      navigation.navigate('Article', { articleId: article.id, article });
    });
  };

  const handleSelectSource = (key: string) => {
    setSelectedSourceKey(key);
  };

  const handleSetMainFeedAndGoHome = (source: FeedSource) => {
    setSelectedFeedKey(source.key);
    navigation.navigate('MainTabs', { screen: 'Latest' });
  };

  // Render header for the articles list
  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      {/* 1. Category Hero Banner */}
      <View
        style={[
          styles.heroBanner,
          {
            backgroundColor: visual.color,
            borderColor: withAlpha(colors.border, 0.4),
          },
        ]}
      >
        <Image
          source={{ uri: visual.image }}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <View style={styles.heroOverlay} />

        <View style={styles.heroContent}>
          <View style={[styles.heroIconBadge, { backgroundColor: withAlpha(visual.color, 0.9) }]}>
            <MaterialCommunityIcons name={visual.icon} size={22} color="#FFFFFF" />
          </View>
          <Text style={[styles.heroTitle, { fontSize: 20 * scale }]}>
            {currentGroup?.label ?? visual.shortLabel}
          </Text>
          <Text style={[styles.heroTagline, { fontSize: 12.5 * scale }]}>
            {visual.tagline} · มีทั้งหมด {sources.filter((s) => s.type !== 'aggregate').length} แหล่งข่าว
          </Text>
        </View>
      </View>

      {/* 2. Sub-categories / Channels Horizontal Cards (matching reference mockup!) */}
      <View style={styles.sourcesSection}>
        <View style={styles.sourcesHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * scale }]}>
            ช่องข่าวในหมวดหมู่นี้
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.muted, fontSize: 11.5 * scale }]}>
            เลือกเพื่อกรองข่าว
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sourcesScroll}
        >
          {/* Option All */}
          <Pressable
            onPress={() => handleSelectSource('all')}
            style={[
              styles.sourceCard,
              {
                backgroundColor: selectedSourceKey === 'all' ? visual.color : colors.surfaceVariant,
                borderColor: selectedSourceKey === 'all' ? visual.color : colors.border,
              },
            ]}
          >
            <View style={styles.sourceCardTop}>
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={16}
                color={selectedSourceKey === 'all' ? '#FFFFFF' : visual.color}
              />
              <Text
                style={[
                  styles.sourceCardTitle,
                  {
                    color: selectedSourceKey === 'all' ? '#FFFFFF' : colors.text,
                    fontWeight: '800',
                  },
                ]}
              >
                รวมทั้งหมด
              </Text>
            </View>
            <Text
              style={[
                styles.sourceCardSub,
                { color: selectedSourceKey === 'all' ? 'rgba(255,255,255,0.85)' : colors.muted },
              ]}
            >
              ทุกสำนักข่าว
            </Text>
          </Pressable>

          {/* Individual Source Cards */}
          {sources
            .filter((s) => s.type !== 'aggregate')
            .map((source) => {
              const isSelected = selectedSourceKey === source.key;
              const stat = channelStats[source.key];
              const newCount = stat?.newCount ?? 0;

              return (
                <Pressable
                  key={source.key}
                  onPress={() => handleSelectSource(source.key)}
                  style={[
                    styles.sourceCard,
                    {
                      backgroundColor: isSelected ? visual.color : colors.surfaceVariant,
                      borderColor: isSelected ? visual.color : colors.border,
                    },
                  ]}
                >
                  <View style={styles.sourceCardTop}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.sourceCardTitle,
                        {
                          color: isSelected ? '#FFFFFF' : colors.text,
                          fontWeight: isSelected ? '800' : '700',
                        },
                      ]}
                    >
                      {source.label}
                    </Text>
                    {newCount > 0 && (
                      <View style={styles.sourceNewDot}>
                        <Text style={styles.sourceNewDotText}>{newCount}</Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[
                      styles.sourceCardSub,
                      { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.muted },
                    ]}
                  >
                    {source.type.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
        </ScrollView>
      </View>

      {/* 3. Section Title for Articles */}
      <View style={styles.feedHeaderRow}>
        <Text style={[styles.feedHeaderTitle, { color: colors.text, fontSize: 16 * scale }]}>
          {selectedSourceKey === 'all'
            ? `ข่าวล่าสุด (${categoryArticles.length})`
            : `${sources.find((s) => s.key === selectedSourceKey)?.label ?? ''} (${categoryArticles.length})`}
        </Text>

        {selectedSourceKey !== 'all' && (
          <Pressable
            hitSlop={8}
            onPress={() => {
              const src = sources.find((s) => s.key === selectedSourceKey);
              if (src) handleSetMainFeedAndGoHome(src);
            }}
            style={styles.setMainFeedBtn}
          >
            <Text style={[styles.setMainFeedText, { color: visual.color }]}>
              อ่านในหน้าหลัก ↗
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Top Custom Navigation Header */}
      <View style={[styles.navHeader, { borderBottomColor: withAlpha(colors.border, 0.5) }]}>
        <Pressable
          hitSlop={12}
          onPress={() => navigation.goBack()}
          style={[styles.navIconBtn, { backgroundColor: colors.surfaceVariant }]}
          accessibilityLabel="ย้อนกลับ"
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
        </Pressable>

        <Text numberOfLines={1} style={[styles.navTitle, { color: colors.text, fontSize: 16.5 * scale }]}>
          {visual.shortLabel}
        </Text>

        <Pressable
          hitSlop={12}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Search' })}
          style={[styles.navIconBtn, { backgroundColor: colors.surfaceVariant }]}
          accessibilityLabel="ค้นหาข่าว"
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Main Content: News Feed with Header */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <CustomRefreshHeader
            visible={true}
            label={`กำลังโหลดข่าว${visual.shortLabel}...`}
            color={visual.color}
          />
          <SkeletonFeed layout={settings.cardLayout} count={5} />
        </View>
      ) : (
        <FlatList
          data={categoryArticles}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View>
              {renderListHeader()}
              <CustomRefreshHeader
                visible={isRefreshing}
                label="กำลังอัปเดตข่าวล่าสุด..."
                color={visual.color}
              />
            </View>
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + 20, 32) },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[visual.color]}
              tintColor={visual.color}
            />
          }
          renderItem={({ item }) => (
            <NewsCard
              article={item}
              isBookmarked={Boolean(bookmarks[item.id])}
              onPress={() => handleOpenArticle(item)}
              onToggleBookmark={() => toggleBookmark(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="newspaper-variant-outline" size={48} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                ยังไม่มีข่าวในหมวดหมู่นี้ หรือกำลังอัปเดตข้อมูล
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  navIconBtn: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  navTitle: {
    flex: 1,
    fontWeight: '800',
    marginHorizontal: 12,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  listHeaderContainer: {
    marginBottom: 8,
  },
  heroBanner: {
    borderRadius: 16,
    borderWidth: 1,
    height: 140,
    marginHorizontal: 14,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    height: '100%',
    width: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  heroContent: {
    bottom: 14,
    gap: 4,
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 2,
  },
  heroIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    marginBottom: 2,
    width: 36,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  sourcesSection: {
    marginTop: 16,
  },
  sourcesHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontWeight: '500',
  },
  sourcesScroll: {
    gap: 8,
    paddingHorizontal: 14,
  },
  sourceCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minWidth: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sourceCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  sourceCardTitle: {
    fontSize: 13,
  },
  sourceNewDot: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sourceNewDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  sourceCardSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  feedHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  feedHeaderTitle: {
    fontWeight: '800',
  },
  setMainFeedBtn: {
    paddingVertical: 4,
  },
  setMainFeedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
