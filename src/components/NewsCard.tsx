import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNews } from '../store/NewsContext';
import { NewsArticle } from '../types';
import { formatRelative } from '../utils/content';

interface Props {
  article: NewsArticle;
  isBookmarked: boolean;
  onPress: () => void;
  onToggleBookmark: () => void;
}

export function NewsCard({ article, isBookmarked, onPress, onToggleBookmark }: Props) {
  const { colors, scale } = useNews();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.card,
      { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.82 : 1 },
    ]}>
      {article.imageUrl ? <Image source={{ uri: article.imageUrl }} style={styles.image} /> : null}
      <View style={styles.body}>
        <Text numberOfLines={3} style={[styles.title, { color: colors.text, fontSize: 17 * scale }]}>
          {article.title}
        </Text>
        {article.description ? (
          <Text numberOfLines={2} style={[styles.description, { color: colors.muted, fontSize: 13 * scale }]}>
            {article.description}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text numberOfLines={1} style={[styles.meta, { color: colors.muted, fontSize: 12 * scale }]}>
            {[article.author, formatRelative(article.publishedMillis), `${article.readingTime} นาที`]
              .filter(Boolean).join(' · ')}
          </Text>
          <Pressable
            accessibilityLabel={isBookmarked ? 'ยกเลิกบันทึกข่าว' : 'บันทึกข่าว'}
            hitSlop={12}
            onPress={(event) => { event.stopPropagation(); onToggleBookmark(); }}
          >
            <MaterialCommunityIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={isBookmarked ? colors.primary : colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 14, overflow: 'hidden' },
  image: { width: '100%', height: 180, backgroundColor: '#D7DBE4' },
  body: { padding: 16 },
  title: { fontWeight: '700', lineHeight: 24 },
  description: { lineHeight: 19, marginTop: 8 },
  metaRow: { alignItems: 'center', flexDirection: 'row', marginTop: 14 },
  meta: { flex: 1, marginRight: 12 },
});
