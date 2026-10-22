import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AdBanner } from '../../../components/AdBanner';
import { AdCard } from '../../../components/AdCard';
import { NewsCard } from '../../../components/NewsCard';
import { ScreenState } from '../../../components/ScreenState';
import { SkeletonFeed } from '../../../components/SkeletonCard';
import { CustomRefreshHeader } from '../../../components/CustomRefreshIndicator';
import { TopProgressBar, HomeLoadingProgressCard } from '../../../components/LoadingProgressBar';
import { formatRelative } from '../../../utils/content';
import { withAlpha } from '../constants';
import { LatestViewModel } from '../types';
import { CategoryTabBar } from './CategoryTabBar';
import { SourceTabBar } from './SourceTabBar';
import { StatusFilterBar } from './StatusFilterBar';

interface CategoryFeedViewProps {
  vm: LatestViewModel;
}

export function CategoryFeedView({ vm }: CategoryFeedViewProps) {
  const {
    colors,
    scale,
    settings,
    activeGroup,
    selectedFeed,
    articles,
    filteredArticles,
    visibleArticles,
    hasMore,
    newArticlesCount,
    bookmarks,
    isRefreshing,
    isWaitingForLoading,
    hasFetchError,
    lastRefreshNewCount,
    lastUpdated,
    isShowingCachedFeed,
    statusFilter,
    setStatusFilter,
    handleRefreshAll,
    handlePressArticle,
    handleLayoutToggle,
    handleEndReached,
    toggleBookmark,
    markAllAsRead,
    clearFreshCount,
  } = vm;

  const groupColor = activeGroup?.color ?? colors.primary;

  // Waiting for loading state (Skeleton)
  if (isWaitingForLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopProgressBar progress={0.65} visible={true} color={groupColor} />
        <View style={styles.topTabsWrap}>
          <CategoryTabBar vm={vm} />
          <SourceTabBar vm={vm} />
        </View>
        <View style={styles.progressCardWrap}>
          <HomeLoadingProgressCard
            progress={0.65}
            statusText={`กำลังโหลดข่าว${selectedFeed?.label ? ` ${selectedFeed.label}` : ''}...`}
            color={groupColor}
          />
        </View>
        <SkeletonFeed layout={settings.cardLayout} count={5} />
      </View>
    );
  }

  // Network Error State
  if (hasFetchError && !articles.length) {
    return (
      <ScreenState
        icon="cloud-alert-outline"
        title="โหลดข่าวไม่สำเร็จ"
        subtitle="ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง"
        actionLabel="ลองใหม่"
        onAction={() => void handleRefreshAll()}
      />
    );
  }

  return (
    <View style={[styles.screenContainer, { backgroundColor: colors.background }]}>
      <TopProgressBar progress={0.8} visible={isRefreshing} color={groupColor} />

      <FlatList
        key={settings.cardLayout === 'grid' ? 'grid-latest-2cols' : 'list-latest-1col'}
        numColumns={settings.cardLayout === 'grid' ? 2 : 1}
        columnWrapperStyle={settings.cardLayout === 'grid' ? styles.gridColumnWrap : undefined}
        data={visibleArticles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 24 }]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefreshAll(true)}
            tintColor={groupColor}
            colors={[groupColor]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <CategoryTabBar vm={vm} />
            <SourceTabBar vm={vm} />

            {/* Custom Refresh Indicator Header during pull-to-refresh */}
            <CustomRefreshHeader
              visible={isRefreshing}
              label="กำลังอัปเดตข่าวล่าสุด..."
              color={groupColor}
            />

            {/* New Articles Banner on Refresh */}
            {lastRefreshNewCount > 0 && (
              <View
                style={[
                  styles.newAlertBanner,
                  { backgroundColor: withAlpha('#EF4444', 0.12), borderColor: '#EF4444' },
                ]}
              >
                <View style={styles.newAlertTextWrap}>
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color="#EF4444" />
                  <Text style={[styles.newAlertText, { color: colors.text, fontSize: 13 * scale }]}>
                    พบข่าวใหม่มาเพิ่ม{' '}
                    <Text style={{ fontWeight: '900', color: '#EF4444' }}>
                      {lastRefreshNewCount}
                    </Text>{' '}
                    ข่าว!
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

            {/* Offline Cache Banner */}
            {isShowingCachedFeed && (
              <View style={[styles.banner, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.bannerText, { color: colors.muted, fontSize: 13 * scale }]}>
                  ออฟไลน์ — กำลังแสดงข่าวที่บันทึกไว้
                </Text>
              </View>
            )}

            {/* Heading & Layout Actions */}
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
                  onPress={handleLayoutToggle}
                  style={[
                    styles.layoutToggleBtn,
                    { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
                  ]}
                  accessibilityLabel="เปลี่ยนรูปแบบการแสดงผล"
                >
                  <MaterialCommunityIcons
                    name={
                      settings.cardLayout === 'compact'
                        ? 'view-agenda-outline'
                        : settings.cardLayout === 'magazine'
                        ? 'view-grid-outline'
                        : 'view-headline'
                    }
                    size={19}
                    color={colors.primary}
                  />
                </Pressable>

                {newArticlesCount > 0 ? (
                  <Pressable
                    hitSlop={8}
                    onPress={markAllAsRead}
                    style={[
                      styles.markAllReadBtn,
                      { backgroundColor: withAlpha(colors.primary, 0.12) },
                    ]}
                  >
                    <MaterialCommunityIcons name="check-all" size={15} color={colors.primary} />
                    <Text
                      style={[
                        styles.markAllReadText,
                        { color: colors.primary, fontSize: 11 * scale },
                      ]}
                    >
                      อ่านหมด
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.countBadge,
                      { backgroundColor: withAlpha(groupColor, 0.12) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,
                        { color: groupColor, fontSize: 13 * scale },
                      ]}
                    >
                      {articles.length} ข่าว
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Status Filter Bar (ทั้งหมด / ข่าวใหม่ / อ่านแล้ว) */}
            <StatusFilterBar vm={vm} />
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
                <Text
                  style={[styles.emptyResetText, { color: colors.primary, fontSize: 13 * scale }]}
                >
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
          <View style={settings.cardLayout === 'grid' ? styles.gridItemWrapper : undefined}>
            <NewsCard
              article={item}
              isBookmarked={Boolean(bookmarks[item.id])}
              onToggleBookmark={() => toggleBookmark(item)}
              onPress={() =>
                handlePressArticle(
                  item,
                  filteredArticles,
                  activeGroup?.key,
                  activeGroup?.label,
                )
              }
            />
            {settings.cardLayout !== 'grid' && (index + 1) % 5 === 0 && (
              <AdCard style={styles.inFeedAdCard} />
            )}
          </View>
        )}
      />

      <AdBanner
        style={[
          styles.bottomAdBanner,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1 },
  topTabsWrap: { paddingHorizontal: 16, paddingTop: 10 },
  progressCardWrap: { paddingHorizontal: 16, marginTop: 8 },
  gridColumnWrap: {
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    flex: 1,
  },
  bottomAdBanner: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 2,
  },
  inFeedAdCard: {
    marginVertical: 10,
  },
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 96 },
  headerSection: { marginBottom: 6 },
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
  newAlertText: { fontWeight: '700' },
  newAlertActionWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  newAlertBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newAlertBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  newAlertCloseBtn: { padding: 4 },
  headingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heading: { fontWeight: '900', letterSpacing: -0.3 },
  updated: { marginTop: 2 },
  headingActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  layoutToggleBtn: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    padding: 6,
  },
  markAllReadBtn: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  markAllReadText: { fontWeight: '800' },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  countText: { fontWeight: '700' },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyResetBtn: {
    borderRadius: 8,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  emptyResetText: { fontWeight: '700' },
  footerLoader: { paddingVertical: 16 },
  newHeaderBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  newHeaderBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});
