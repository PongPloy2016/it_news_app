import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';

export function BookmarksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { bookmarks, toggleBookmark } = useNews();
  const articles = Object.values(bookmarks).sort(
    (a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0),
  );
  if (!articles.length) {
    return <ScreenState icon="bookmark-outline" title="ยังไม่มีข่าวที่บันทึก"
      subtitle="แตะไอคอนบุ๊กมาร์กบนข่าวที่สนใจ แล้วกลับมาอ่านภายหลังได้ที่นี่" />;
  }
  return <FlatList data={articles} keyExtractor={(item) => item.id}
    contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
    renderItem={({ item }) => <NewsCard article={item} isBookmarked
      onToggleBookmark={() => toggleBookmark(item)}
      onPress={() => navigation.navigate('Article', { articleId: item.id })} />} />;
}

const styles = StyleSheet.create({ list: { padding: 16, paddingBottom: 96 } });
