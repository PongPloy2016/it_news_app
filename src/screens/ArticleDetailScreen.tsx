import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { ScreenState } from '../components/ScreenState';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';
import { formatRelative, stripHtml } from '../utils/content';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const { articles, bookmarks, colors, scale, toggleBookmark } = useNews();
  const article = articles.find((item) => item.id === route.params.articleId) ?? bookmarks[route.params.articleId];
  if (!article) {
    return <ScreenState icon="newspaper-remove" title="ไม่พบข่าวนี้"
      subtitle="ข่าวอาจถูกลบออกจากแคชแล้ว ลองกลับไปหน้ารายการและเปิดใหม่อีกครั้ง" />;
  }
  const bookmarked = Boolean(bookmarks[article.id]);
  return (
    <ScrollView contentContainerStyle={styles.content}>
      {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.text, fontSize: 25 * scale }]}>{article.title}</Text>
        <Text style={[styles.meta, { color: colors.muted, fontSize: 13 * scale }]}>
          {[article.author, formatRelative(article.publishedMillis), `อ่าน ${article.readingTime} นาที`]
            .filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.actions}>
          <Pressable onPress={() => toggleBookmark(article)}
            style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name={bookmarked ? 'bookmark' : 'bookmark-outline'} size={22} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>{bookmarked ? 'บันทึกแล้ว' : 'บันทึก'}</Text>
          </Pressable>
          <Pressable onPress={() => void Share.share({ message: `${article.title}\n${article.link}` })}
            style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text }]}>แชร์</Text>
          </Pressable>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.description, { color: colors.text, fontSize: 16 * scale }]}>
          {article.description || stripHtml(article.content)}
        </Text>
        <Pressable onPress={() => navigation.navigate('WebView', { url: article.link, title: article.title })}
          style={[styles.openButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.openText, { color: colors.onPrimary, fontSize: 15 * scale }]}>อ่านข่าวฉบับเต็ม</Text>
          <MaterialCommunityIcons name="open-in-new" size={19} color={colors.onPrimary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  image: { height: 240, width: '100%', backgroundColor: '#D7DBE4' },
  body: { padding: 20 },
  title: { fontWeight: '800', lineHeight: 34 },
  meta: { lineHeight: 20, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  actionButton: { alignItems: 'center', borderRadius: 12, flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  actionText: { fontWeight: '700', marginLeft: 7 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 22 },
  description: { lineHeight: 27 },
  openButton: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', justifyContent: 'center', marginTop: 26, padding: 15 },
  openText: { fontWeight: '800', marginRight: 8 },
});
