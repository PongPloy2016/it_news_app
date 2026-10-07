import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCategoryVisual } from '../config/categoryVisuals';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const PADDING_H = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.15);

export function CategoriesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { feedGroups, colors, scale, isDark, refresh, isRefreshing, channelStats, articles, isArticleNew } = useNews();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate stats for each group
  const groupsWithStats = useMemo(() => {
    return feedGroups.map((group) => {
      const visual = getCategoryVisual(group.key, group.label, group.color);
      const regularSources = group.sources.filter((s) => s.type !== 'aggregate');

      let newCount = 0;
      let totalArticles = 0;
      for (const source of group.sources) {
        const stat = channelStats[source.key];
        if (stat) {
          totalArticles += stat.total;
          newCount += stat.newCount;
        }
      }

      return {
        ...group,
        visual,
        sourceCount: regularSources.length,
        totalArticles: Math.max(totalArticles, regularSources.length * 5),
        newCount,
      };
    });
  }, [feedGroups, channelStats]);

  // Filter groups if searching
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return groupsWithStats;
    return groupsWithStats.filter(
      (g) =>
        g.label.toLowerCase().includes(q) ||
        g.visual.shortLabel.toLowerCase().includes(q) ||
        g.visual.tagline.toLowerCase().includes(q) ||
        g.sources.some((s) => s.label.toLowerCase().includes(q)),
    );
  }, [groupsWithStats, searchQuery]);

  const totalSources = useMemo(() => {
    return feedGroups.reduce((acc, g) => acc + g.sources.filter((s) => s.type !== 'aggregate').length, 0);
  }, [feedGroups]);

  const renderCategoryCard = ({ item }: { item: (typeof groupsWithStats)[number] }) => {
    const { visual, newCount, sourceCount } = item;

    return (
      <Pressable
        onPress={() => {
          navigation.navigate('CategoryDetail', { groupKey: item.key });
        }}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: visual.color,
            borderColor: withAlpha(colors.border, isDark ? 0.35 : 0.2),
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
        ]}
      >
        {/* Card Background Image with overlay */}
        <Image
          source={{ uri: visual.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />

        {/* Gradient dark overlay */}
        <View style={styles.cardGradientOverlay} />

        {/* Top Header inside Card */}
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBadge, { backgroundColor: withAlpha(visual.color, 0.88) }]}>
            <MaterialCommunityIcons name={visual.icon} size={18} color="#FFFFFF" />
          </View>

          {newCount > 0 ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>{newCount} ใหม่</Text>
            </View>
          ) : (
            <View style={styles.sourceCountBadge}>
              <Text style={styles.sourceCountText}>{sourceCount} ช่อง</Text>
            </View>
          )}
        </View>

        {/* Bottom Content inside Card: Clean bold title like reference mockup */}
        <View style={styles.cardBottomContent}>
          <Text numberOfLines={2} style={[styles.cardTitle, { fontSize: 16.5 * scale }]}>
            {visual.shortLabel}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search & Filter Input */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ค้นหาหมวดหมู่ หรือสำนักข่าว..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text, fontSize: 13.5 * scale }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* 3. Categories 2-Column Grid */}
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.key}
        renderItem={renderCategoryCard}
        numColumns={2}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: 110 + insets.bottom },
        ]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search-outline" size={48} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              ไม่พบหมวดหมู่ที่ค้นหา "{searchQuery}"
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: PADDING_H,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 42,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  gridContent: {
    paddingHorizontal: PADDING_H,
    paddingTop: 4,
  },
  columnWrapper: {
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    width: CARD_WIDTH,
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
    height: '100%',
    width: '100%',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sourceCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardBottomContent: {
    bottom: 14,
    left: 14,
    position: 'absolute',
    right: 14,
    zIndex: 2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
