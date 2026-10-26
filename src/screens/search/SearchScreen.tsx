import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SearchHistoryView } from './components/SearchHistoryView';
import { SearchResultsView } from './components/SearchResultsView';
import { useSearchViewModel } from './useSearchViewModel';

export function SearchScreen() {
  const vm = useSearchViewModel();
  const { query, setQuery, colors, scale, handleSearchSubmit } = vm;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Input Box */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={23} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาหัวข้อหรือผู้เขียน"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
          style={[styles.input, { color: colors.text, fontSize: 16 * scale }]}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10}>
            <MaterialCommunityIcons name="close-circle" size={21} color={colors.muted} />
          </Pressable>
        ) : null}
      </View>

      {/* Main Content: Search History or Filtered Results */}
      {!query.trim() ? <SearchHistoryView vm={vm} /> : <SearchResultsView vm={vm} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchBox: {
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    height: 52,
    marginHorizontal: 9,
  },
});
