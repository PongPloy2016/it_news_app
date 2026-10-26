import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { NewsCard } from '../../../components/NewsCard';
import { ScreenState } from '../../../components/ScreenState';
import { SearchViewModel } from '../types';

export function SearchResultsView({ vm }: { vm: SearchViewModel }) {
  const { results, settings, bookmarks, insets, toggleBookmark, handleArticlePress } = vm;

  if (!results.length) {
    return (
      <ScreenState
        icon="magnify-close"
        title="ไม่พบผลการค้นหา"
        subtitle="ลองใช้คำค้นหาอื่นดูนะ"
      />
    );
  }

  return (
    <FlatList
      key={settings.cardLayout === 'grid' ? 'grid-search-2cols' : 'list-search-1col'}
      numColumns={settings.cardLayout === 'grid' ? 2 : 1}
      columnWrapperStyle={settings.cardLayout === 'grid' ? styles.gridColumnWrap : undefined}
      data={results}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.results, { paddingBottom: 150 + insets.bottom }]}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <View style={settings.cardLayout === 'grid' ? styles.gridItemWrapper : undefined}>
          <NewsCard
            article={item}
            isBookmarked={Boolean(bookmarks[item.id])}
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => handleArticlePress(item)}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  results: {
    paddingTop: 16,
    paddingBottom: 96,
  },
  gridColumnWrap: {
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    flex: 1,
  },
});
