import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookmarksViewModel } from '../types';

export function BookmarksSearchBar({ vm }: { vm: BookmarksViewModel }) {
  const {
    allArticles,
    searchQuery,
    setSearchQuery,
    availableSources,
    selectedSource,
    setSelectedSource,
    colors,
    scale,
  } = vm;

  return (
    <View>
      {/* Search Input Bar */}
      {allArticles.length > 3 && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ค้นหาในข่าวที่บันทึกไว้..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text, fontSize: 13 * scale }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      {/* Publisher Chips */}
      {availableSources.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
        >
          {availableSources.map((source) => {
            const isSelected = selectedSource === source.key;
            return (
              <Pressable
                key={source.key}
                onPress={() => setSelectedSource(source.key)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '700' : '600',
                      fontSize: 12 * scale,
                    },
                  ]}
                >
                  {source.label} ({source.count})
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    height: 40,
    marginTop: 10,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
  },
  chipsScroll: {
    gap: 6,
    marginTop: 10,
    paddingBottom: 4,
  },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5.5,
  },
  chipText: {
    textAlign: 'center',
  },
});
