import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';
import { showInterstitialAndNavigate } from '../services/interstitialService';

export function SearchScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { articles, bookmarks, searchHistory, colors, scale, toggleBookmark, addSearchHistory, clearSearchHistory } = useNews();
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('th');
    if (!term) return [];
    return articles.filter((item) => [item.title, item.description, item.author ?? '']
      .some((value) => value.toLocaleLowerCase('th').includes(term)));
  }, [articles, query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={23} color={colors.muted} />
        <TextInput value={query} onChangeText={setQuery} placeholder="ค้นหาหัวข้อหรือผู้เขียน"
          placeholderTextColor={colors.muted} returnKeyType="search"
          onSubmitEditing={() => addSearchHistory(query)}
          style={[styles.input, { color: colors.text, fontSize: 16 * scale }]} />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={10}>
          <MaterialCommunityIcons name="close-circle" size={21} color={colors.muted} />
        </Pressable> : null}
      </View>

      {!query.trim() ? (
        searchHistory.length ? <View style={styles.history}>
          <View style={styles.historyHeading}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 16 * scale }]}>การค้นหาล่าสุด</Text>
            <Pressable onPress={clearSearchHistory}><Text style={{ color: colors.primary }}>ล้างทั้งหมด</Text></Pressable>
          </View>
          <View style={styles.chips}>
            {searchHistory.map((item) => <Pressable key={item} onPress={() => setQuery(item)}
              style={[styles.chip, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={{ color: colors.text, fontSize: 13 * scale }}>{item}</Text>
            </Pressable>)}
          </View>
        </View> : <ScreenState icon="text-search" title="ค้นหาข่าวสาร"
          subtitle="ค้นหาจากข่าวที่ดาวน์โหลดไว้ ตามหัวข้อ เนื้อหา หรือชื่อผู้เขียน" />
      ) : results.length ? (
        <FlatList data={results} keyExtractor={(item) => item.id} contentContainerStyle={[styles.results, { paddingBottom: 150 + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => <NewsCard article={item} isBookmarked={Boolean(bookmarks[item.id])}
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => {
              addSearchHistory(query);
              void showInterstitialAndNavigate(() => {
                navigation.navigate('Article', { articleId: item.id });
              });
            }} />} />
      ) : <ScreenState icon="magnify-close" title="ไม่พบผลการค้นหา" subtitle="ลองใช้คำค้นหาอื่นดูนะ" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchBox: { alignItems: 'center', borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 14 },
  input: { flex: 1, height: 52, marginHorizontal: 9 },
  history: { paddingTop: 20 },
  historyHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  results: { paddingTop: 16, paddingBottom: 96 },
});
