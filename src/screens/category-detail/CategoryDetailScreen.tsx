import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { CustomRefreshHeader } from '../../components/CustomRefreshIndicator';
import { NewsCard } from '../../components/NewsCard';
import { SkeletonFeed } from '../../components/SkeletonCard';
import { CategoryDetailHeader } from './components/CategoryDetailHeader';
import { CategoryHeroBanner } from './components/CategoryHeroBanner';
import { CategorySourcesTabBar } from './components/CategorySourcesTabBar';
import { useCategoryDetailViewModel } from './useCategoryDetailViewModel';

export function CategoryDetailScreen() {
  const vm = useCategoryDetailViewModel();
  const {
    visual,
    sources,
    selectedSourceKey,
    categoryArticles,
    isLoading,
    isRefreshing,
    colors,
    scale,
    insets,
    settings,
    bookmarks,
    onRefresh,
    handleOpenArticle,
    handleSetMainFeedAndGoHome,
    toggleBookmark,
  } = vm;

  const renderListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <CategoryHeroBanner vm={vm} />
      <CategorySourcesTabBar vm={vm} />

      {/* Feed Section Title */}
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
      <CategoryDetailHeader vm={vm} />

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
          key={settings.cardLayout === 'grid' ? 'grid-category-2cols' : 'list-category-1col'}
          numColumns={settings.cardLayout === 'grid' ? 2 : 1}
          columnWrapperStyle={settings.cardLayout === 'grid' ? styles.gridColumnWrap : undefined}
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
            <View style={settings.cardLayout === 'grid' ? styles.gridItemWrapper : undefined}>
              <NewsCard
                article={item}
                isBookmarked={Boolean(bookmarks[item.id])}
                onPress={() => handleOpenArticle(item)}
                onToggleBookmark={() => toggleBookmark(item)}
              />
            </View>
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
  listContent: {
    paddingBottom: 24,
  },
  gridColumnWrap: {
    gap: 10,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  gridItemWrapper: {
    flex: 1,
  },
  listHeaderContainer: {
    marginBottom: 8,
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
