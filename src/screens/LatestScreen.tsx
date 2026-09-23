import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { AdBanner } from '../components/AdBanner';
import { AdCard } from '../components/AdCard';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { SkeletonFeed } from '../components/SkeletonCard';
import { UnderlineTabBar, UnderlineTabItem } from '../components/UnderlineTabBar';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';
import { formatRelative } from '../utils/content';
import { showInterstitialAndNavigate } from '../services/interstitialService';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const GROUP_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  'tech-business': 'laptop',
  'international': 'earth',
  'thai-news': 'newspaper',
  'mobile': 'cellphone',
  'computer-games': 'gamepad-variant',
};

const PAGE_SIZE = 10;

export function LatestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read'>('all');

  const {
    feedGroups,
    articles,
    bookmarks,
    colors,
    scale,
    settings,
    setCardLayout,
    isHydrated,
    isRefreshing,
    hasFetchError,
    isShowingCachedFeed,
    lastUpdated,
    refresh,
    selectedFeed,
    selectedFeedKey,
    setSelectedFeedKey,
    toggleBookmark,
    markAsRead,
    markAllAsRead,
    isArticleNew,
    isArticleRead,
    lastRefreshNewCount,
    clearFreshCount,
  } = useNews();

  const activeGroup = useMemo(
    () => feedGroups.find((group) => group.sources.some((item) => item.key === selectedFeedKey)) ?? feedGroups[0],
    [feedGroups, selectedFeedKey],
  );
  const [activeGroupKey, setActiveGroupKey] = useState(activeGroup?.key ?? 'tech-business');

  const newArticlesCount = useMemo(
    () => articles.filter(isArticleNew).length,
    [articles, isArticleNew],
  );

  const readArticlesCount = useMemo(
    () => articles.filter((item) => isArticleRead(item.id)).length,
    [articles, isArticleRead],
  );

  const filteredArticles = useMemo(() => {
    if (statusFilter === 'new') return articles.filter(isArticleNew);
    if (statusFilter === 'read') return articles.filter((item) => isArticleRead(item.id));
    return articles;
  }, [articles, isArticleNew, isArticleRead, statusFilter]);

  useEffect(() => {
    setVisibleCount((current) => Math.min(Math.max(current, PAGE_SIZE), filteredArticles.length || PAGE_SIZE));
  }, [filteredArticles.length]);

  useEffect(() => {
    const matchedGroup = feedGroups.find((group) => group.sources.some((item) => item.key === selectedFeedKey));
    if (matchedGroup) setActiveGroupKey(matchedGroup.key);
  }, [feedGroups, selectedFeedKey]);

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;
  const activeSources = activeGroup?.sources ?? [];

  const categoryTabs: UnderlineTabItem[] = useMemo(() => {
    return feedGroups.map((group) => {
      const cleanLabel = group.label.replace(/^ข่าว/, '');
      const icon = GROUP_ICONS[group.key] || 'newspaper';
      return {
        key: group.key,
        label: cleanLabel,
        iconName: icon,
        color: group.color,
      };
    });
  }, [feedGroups]);

  const renderCategoryTabBar = () => (
    <UnderlineTabBar
      scrollable
      tabs={categoryTabs}
      activeKey={activeGroupKey}
      onChange={(key) => {
        setActiveGroupKey(key);
        const group = feedGroups.find((g) => g.key === key);
        const firstFeed = group?.sources[0];
        if (firstFeed) setSelectedFeedKey(firstFeed.key);
      }}
      indicatorColor={activeGroup?.color ?? '#2F6FED'}
      style={styles.mainTabBarWrap}
    />
  );

  const renderSourceTabBar = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.subTabBar}
      style={styles.subTabBarWrap}
    >
      {activeSources.map((feed) => {
        const active = feed.key === selectedFeedKey;
        const isAggregate = feed.type === 'aggregate';
        const groupColor = activeGroup.color;
        return (
          <Pressable
            key={feed.key}
            onPress={() => setSelectedFeedKey(feed.key)}
            style={[
              styles.subTabItem,
              {
                backgroundColor: active
                  ? groupColor
                  : isAggregate
                  ? withAlpha(groupColor, 0.12)
                  : colors.surface,
                borderColor: active
                  ? groupColor
                  : isAggregate
                  ? withAlpha(groupColor, 0.4)
                  : colors.border,
              },
            ]}
          >
            {isAggregate && (
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={13 * scale}
                color={active ? '#FFFFFF' : groupColor}
                style={{ marginRight: 3 }}
              />
            )}
            <Text
              style={[
                styles.subTabLabel,
                {
                  color: active ? '#FFFFFF' : isAggregate ? groupColor : colors.text,
                  fontSize: 11.5 * scale,
                  fontWeight: active || isAggregate ? '700' : '500',
                },
              ]}
            >
              {feed.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  const renderStatusFilterBar = () => (
    <View style={styles.statusFilterBar}>
      <Pressable
        onPress={() => setStatusFilter('all')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'all' ? colors.primary : colors.surfaceVariant,
            borderColor: statusFilter === 'all' ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'all' ? '#FFFFFF' : colors.text,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'all' ? '800' : '600',
            },
          ]}
        >
          ทั้งหมด ({articles.length})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setStatusFilter('new')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'new' ? '#EF4444' : colors.surfaceVariant,
            borderColor: statusFilter === 'new' ? '#EF4444' : newArticlesCount > 0 ? withAlpha('#EF4444', 0.5) : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="fire"
          size={13 * scale}
          color={statusFilter === 'new' ? '#FFFFFF' : '#EF4444'}
        />
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'new' ? '#FFFFFF' : colors.text,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'new' ? '800' : '600',
            },
          ]}
        >
          ข่าวใหม่ ({newArticlesCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setStatusFilter('read')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'read' ? colors.muted : colors.surfaceVariant,
            borderColor: statusFilter === 'read' ? colors.muted : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="check"
          size={13 * scale}
          color={statusFilter === 'read' ? '#FFFFFF' : colors.muted}
        />
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'read' ? '#FFFFFF' : colors.muted,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'read' ? '800' : '600',
            },
          ]}
        >
          อ่านแล้ว ({readArticlesCount})
        </Text>
      </Pressable>
    </View>
  );

  if (selectedFeed.type === 'html') {
    return (
      <View style={[styles.htmlScreen, { backgroundColor: colors.background }]}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {renderCategoryTabBar()}
          {renderSourceTabBar()}
        </View>

        <View style={styles.webViewWrap}>
          <WebView
            source={{ uri: selectedFeed.url }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />
        </View>
      </View>
    );
  }

  if (!isHydrated || (isRefreshing && !articles.length)) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
          {renderCategoryTabBar()}
          {renderSourceTabBar()}
        </View>
        <SkeletonFeed layout={settings.cardLayout} count={4} />
      </View>
    );
  }

  if (hasFetchError && !articles.length) {
    return (
      <ScreenState
        icon="cloud-alert-outline"
        title="โหลดข่าวไม่สำเร็จ"
        subtitle="ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง"
        actionLabel="ลองใหม่"
        onAction={() => void refresh()}
      />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <FlatList
        data={visibleArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh(true)} tintColor={colors.primary} />}
      onEndReached={() => {
        if (!isRefreshing && hasMore) {
          setVisibleCount((current) => Math.min(current + PAGE_SIZE, filteredArticles.length));
        }
      }}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View style={styles.headerSection}>
          {renderCategoryTabBar()}
          {renderSourceTabBar()}

          {/* New Articles Banner on Refresh */}
          {lastRefreshNewCount > 0 && (
            <View style={[styles.newAlertBanner, { backgroundColor: withAlpha('#EF4444', 0.12), borderColor: '#EF4444' }]}>
              <View style={styles.newAlertTextWrap}>
                <MaterialCommunityIcons name="lightning-bolt" size={18} color="#EF4444" />
                <Text style={[styles.newAlertText, { color: colors.text, fontSize: 13 * scale }]}>
                  พบข่าวใหม่มาเพิ่ม{' '}
                  <Text style={{ fontWeight: '900', color: '#EF4444' }}>{lastRefreshNewCount}</Text> ข่าว!
                </Text>
              </View>
              <View style={styles.newAlertActionWrap}>
                <Pressable
                  onPress={() => {
                    setStatusFilter('new');
                    clearFreshCount();
                  }}
                  style={styles.newAlertBtn}
                >
                  <Text style={styles.newAlertBtnText}>ดูข่าวใหม่</Text>
                </Pressable>
                <Pressable hitSlop={8} onPress={clearFreshCount} style={styles.newAlertCloseBtn}>
                  <MaterialCommunityIcons name="close" size={16} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          )}

          {isShowingCachedFeed ? (
            <View style={[styles.banner, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.bannerText, { color: colors.muted, fontSize: 13 * scale }]}>
                ออฟไลน์ — กำลังแสดงข่าวที่บันทึกไว้
              </Text>
            </View>
          ) : null}

          <View style={styles.headingRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.heading, { color: colors.text, fontSize: 21 * scale }]}>
                  {selectedFeed.label}
                </Text>
                {newArticlesCount > 0 && (
                  <View style={styles.newHeaderBadge}>
                    <Text style={styles.newHeaderBadgeText}>{newArticlesCount} ใหม่</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.updated, { color: colors.muted, fontSize: 12 * scale }]}>
                {lastUpdated ? `อัปเดต ${formatRelative(lastUpdated)}` : 'ดึงลงเพื่อรีเฟรช'}
              </Text>
            </View>

            <View style={styles.headingActions}>
              <Pressable
                hitSlop={8}
                onPress={() => setCardLayout(settings.cardLayout === 'compact' ? 'magazine' : 'compact')}
                style={[
                  styles.layoutToggleBtn,
                  { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                ]}
                accessibilityLabel="เปลี่ยนรูปแบบการแสดงผล"
              >
                <MaterialCommunityIcons
                  name={settings.cardLayout === 'compact' ? 'view-agenda-outline' : 'view-headline'}
                  size={19}
                  color={colors.primary}
                />
              </Pressable>

              {newArticlesCount > 0 ? (
                <Pressable
                  hitSlop={8}
                  onPress={markAllAsRead}
                  style={[styles.markAllReadBtn, { backgroundColor: withAlpha(colors.primary, 0.12) }]}
                >
                  <MaterialCommunityIcons name="check-all" size={15} color={colors.primary} />
                  <Text style={[styles.markAllReadText, { color: colors.primary, fontSize: 11 * scale }]}>
                    อ่านหมด
                  </Text>
                </Pressable>
              ) : (
                <View style={[styles.countBadge, { backgroundColor: withAlpha(activeGroup.color, 0.12) }]}>
                  <Text style={[styles.countText, { color: activeGroup.color, fontSize: 13 * scale }]}>
                    {articles.length} ข่าว
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status Filter Bar (ทั้งหมด / ข่าวใหม่ / อ่านแล้ว) */}
          {renderStatusFilterBar()}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons
            name={statusFilter === 'new' ? 'check-circle-outline' : 'newspaper-variant-outline'}
            size={44}
            color={statusFilter === 'new' ? '#10B981' : colors.muted}
          />
          <Text style={[styles.emptyTitle, { color: colors.text, fontSize: 15 * scale }]}>
            {statusFilter === 'new'
              ? 'คุณอ่านข่าวใหม่ครบทั้งหมดแล้ว!'
              : statusFilter === 'read'
              ? 'ยังไม่มีข่าวที่อ่านแล้ว'
              : 'ไม่พบข่าวในหมวดนี้'}
          </Text>
          {statusFilter !== 'all' && (
            <Pressable
              onPress={() => setStatusFilter('all')}
              style={[styles.emptyResetBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.emptyResetText, { color: colors.primary, fontSize: 13 * scale }]}>
                ดูข่าวทั้งหมด
              </Text>
            </Pressable>
          )}
        </View>
      }
      ListFooterComponent={
        hasMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
      renderItem={({ item, index }) => (
        <View>
          <NewsCard
            article={item}
            isBookmarked={Boolean(bookmarks[item.id])}
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => {
              markAsRead(item.id);
              void showInterstitialAndNavigate(() => {
                navigation.navigate('Article', { articleId: item.id });
              });
            }}
          />
          {(index + 1) % 5 === 0 && (
            <AdCard style={styles.inFeedAdCard} />
          )}
        </View>
      )}
    />
    <AdBanner style={[styles.bottomAdBanner, { backgroundColor: colors.surface, borderTopColor: colors.border }]} />
  </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  bottomAdBanner: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 2,
  },
  inFeedAdCard: {
    marginVertical: 10,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 14 },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 96 },
  headerSection: { marginBottom: 6 },
  htmlScreen: { flex: 1 },
  webViewWrap: { flex: 1, minHeight: 320 },
  webViewLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  mainTabBarWrap: { marginBottom: 8 },
  mainTabBar: { gap: 8, paddingVertical: 4 },
  mainTabButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  tabLabel: { textAlign: 'center' },
  subTabBarWrap: { marginBottom: 12 },
  subTabBar: { gap: 6, paddingVertical: 2 },
  subTabItem: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  subTabLabel: {},
  banner: { borderRadius: 12, marginBottom: 10, padding: 10 },
  bannerText: { textAlign: 'center' },
  newAlertBanner: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  newAlertTextWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  newAlertText: {
    fontWeight: '600',
  },
  newAlertActionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newAlertBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  newAlertCloseBtn: {
    padding: 2,
  },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
  },
  headingActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  layoutToggleBtn: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  heading: { fontWeight: '800' },
  newHeaderBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  markAllReadBtn: {
    alignItems: 'center',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllReadText: {
    fontWeight: '700',
  },
  updated: { marginTop: 2 },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countText: { fontWeight: '800' },
  statusFilterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statusChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
  },
  statusChipText: {
    letterSpacing: 0.1,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyResetBtn: {
    borderRadius: 999,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyResetText: {
    fontWeight: '700',
  },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
});
