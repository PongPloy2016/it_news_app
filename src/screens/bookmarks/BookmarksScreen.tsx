import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { NewsCard } from '../../components/NewsCard';
import { BookmarkListSkeleton } from '../../components/SkeletonCard';
import { BookmarksEmptyView } from './components/BookmarksEmptyView';
import { BookmarksSearchBar } from './components/BookmarksSearchBar';
import { CloudSyncBanner } from './components/CloudSyncBanner';
import { useBookmarksViewModel } from './useBookmarksViewModel';

export function BookmarksScreen() {
  const vm = useBookmarksViewModel();
  const {
    allArticles,
    filteredArticles,
    isManualSyncing,
    isSyncingBookmarks,
    syncFeedback,
    handleSyncDown,
    handleArticlePress,
    toggleBookmark,
    setSearchQuery,
    setSelectedSource,
    colors,
    scale,
    insets,
    settings,
  } = vm;

  const renderListHeader = () => (
    <View style={styles.headerContainer}>
      <CloudSyncBanner vm={vm} />
      {syncFeedback && (
        <View style={[styles.feedbackBanner, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
          <Text style={[styles.feedbackText, { color: colors.text, fontSize: 12 * scale }]}>
            {syncFeedback}
          </Text>
        </View>
      )}
      <BookmarksSearchBar vm={vm} />
    </View>
  );

  // 1. Loading Skeleton State when calling Supabase API and waiting for load
  if (isManualSyncing || (isSyncingBookmarks && !allArticles.length)) {
    return (
      <View style={[styles.skeletonContainer, { backgroundColor: colors.background }]}>
        {renderListHeader()}
        <BookmarkListSkeleton count={5} />
      </View>
    );
  }

  // 2. Empty State (no articles and not currently syncing)
  if (!allArticles.length && !isSyncingBookmarks) {
    return <BookmarksEmptyView vm={vm} header={renderListHeader()} />;
  }

  return (
    <FlatList
      data={filteredArticles}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderListHeader}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: 150 + insets.bottom },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isSyncingBookmarks}
          onRefresh={() => void handleSyncDown(false)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isSyncingBookmarks ? (
          <BookmarkListSkeleton count={5} />
        ) : (
          <View style={styles.searchEmptyWrap}>
            <MaterialCommunityIcons name="magnify-close" size={42} color={colors.muted} />
            <Text style={[styles.searchEmptyTitle, { color: colors.text, fontSize: 15 * scale }]}>
              ไม่พบข่าวที่ตรงกับคำค้นหา
            </Text>
            <Text style={[styles.searchEmptySub, { color: colors.muted, fontSize: 12.5 * scale }]}>
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสำนักข่าวอื่น
            </Text>
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setSelectedSource('all');
              }}
              style={[styles.resetFilterBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.resetFilterBtnText, { color: colors.primary, fontSize: 12 * scale }]}>
                ล้างตัวกรองทั้งหมด
              </Text>
            </Pressable>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={settings.cardLayout === 'grid' ? styles.gridItemWrapper : undefined}>
          <NewsCard
            article={item}
            isBookmarked
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => handleArticlePress(item)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  skeletonContainer: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridItemWrapper: {
    flex: 1,
  },
  feedbackBanner: {
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  feedbackText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  searchEmptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 48,
  },
  searchEmptyTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  searchEmptySub: {
    textAlign: 'center',
  },
  resetFilterBtn: {
    borderRadius: 12,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  resetFilterBtnText: {
    fontWeight: '700',
  },
});
