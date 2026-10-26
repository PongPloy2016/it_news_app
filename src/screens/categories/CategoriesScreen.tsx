import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { CategoryCardItem } from './components/CategoryCardItem';
import { useCategoriesViewModel } from './useCategoriesViewModel';

const CARD_GAP = 12;
const PADDING_H = 16;

export function CategoriesScreen() {
  const vm = useCategoriesViewModel();
  const {
    filteredGroups,
    searchQuery,
    setSearchQuery,
    isRefreshing,
    handleRefresh,
    handleCategoryPress,
    colors,
    scale,
    isDark,
    insets,
  } = vm;

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

      {/* Categories 2-Column Grid */}
      <FlatList
        data={filteredGroups}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => (
          <CategoryCardItem
            item={item}
            onPress={() => handleCategoryPress(item)}
            colors={colors}
            scale={scale}
            isDark={isDark}
          />
        )}
        numColumns={2}
        contentContainerStyle={[styles.gridContent, { paddingBottom: 110 + insets.bottom }]}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
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
