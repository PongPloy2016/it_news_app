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
  const { colors, scale, settings, isArticleNew, isArticleFresh, isArticleRead, isDark } = useNews();
  const isCompact = settings.cardLayout === 'compact';
  const isFresh = isArticleFresh(article);
  const isNew = isArticleNew(article);
  const isRead = isArticleRead(article.id);

  const getBorderColor = () => {
    if (isFresh) return '#EF4444';
    if (isNew) return '#F97316';
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (isFresh) {
      return isDark ? 'rgba(239, 68, 68, 0.08)' : '#FFF5F5';
    }
    return colors.surface;
  };

  // ----------------------------------------------------
  // รูปแบบที่ 1: Compact View (รูป 1 - รายการกะทัดรัด รูปขวาย่อ)
  // ----------------------------------------------------
  if (isCompact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.compactCard,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderLeftWidth: isFresh ? 4.5 : isNew ? 3.5 : 1,
            borderLeftColor: getBorderColor(),
            opacity: isRead ? 0.78 : 1,
            transform: [{ scale: pressed ? 0.985 : 1 }],
            shadowColor: colors.text,
          },
        ]}
      >
        <View style={styles.compactLeft}>
          <View style={styles.compactTitleRow}>
            {isFresh ? (
              <View style={[styles.compactBadge, styles.freshBadgeBg]}>
                <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                <Text style={styles.compactBadgeText}>ใหม่ล่าสุด</Text>
              </View>
            ) : isNew ? (
              <View style={[styles.compactBadge, styles.newBadgeBg]}>
                <MaterialCommunityIcons name="fire" size={11} color="#FFFFFF" />
                <Text style={styles.compactBadgeText}>ข่าวใหม่</Text>
              </View>
            ) : null}

            <Text
              numberOfLines={3}
              style={[
                styles.compactTitle,
                {
                  color: isRead ? colors.muted : colors.text,
                  fontSize: 15 * scale,
                  fontWeight: isRead ? '600' : '800',
                  lineHeight: 21 * scale,
                },
              ]}
            >
              {article.title}
            </Text>
          </View>

          <View style={styles.compactMetaRow}>
            <View style={styles.compactMetaTextWrap}>
              {isRead && (
                <View style={styles.readTag}>
                  <MaterialCommunityIcons name="check" size={12} color={colors.muted} />
                  <Text style={[styles.readTagText, { color: colors.muted, fontSize: 10.5 * scale }]}>
                    อ่านแล้ว
                  </Text>
                  <Text style={{ color: colors.muted, marginHorizontal: 3 }}>·</Text>
                </View>
              )}

              {article.author ? (
                <Text numberOfLines={1} style={[styles.compactAuthor, { color: colors.primary, fontSize: 11.5 * scale }]}>
                  {article.author}
                </Text>
              ) : null}
              {article.publishedMillis ? (
                <Text numberOfLines={1} style={[styles.compactDate, { color: colors.muted, fontSize: 11 * scale }]}>
                  {article.author ? ' · ' : ''}
                  {formatRelative(article.publishedMillis)}
                </Text>
              ) : null}
            </View>

            <Pressable
              hitSlop={10}
              onPress={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
              style={styles.compactBookmarkBtn}
            >
              <MaterialCommunityIcons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={isBookmarked ? colors.primary : colors.muted}
              />
            </Pressable>
          </View>
        </View>

        {article.imageUrl ? (
          <View style={styles.compactImageWrap}>
            <Image source={{ uri: article.imageUrl }} style={styles.compactImage} resizeMode="cover" />
          </View>
        ) : null}
      </Pressable>
    );
  }

  // ----------------------------------------------------
  // รูปแบบที่ 2: Magazine View (รูป 2 - การ์ดรูปใหญ่เต็มความกว้าง)
  // ----------------------------------------------------
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderLeftWidth: isFresh ? 5 : isNew ? 4 : 1,
          borderLeftColor: getBorderColor(),
          opacity: isRead ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          shadowColor: colors.text,
        },
      ]}
    >
      {article.imageUrl ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />

          {/* Highlight Badge on image */}
          {isFresh ? (
            <View style={[styles.magazineBadge, styles.freshBadgeBg]}>
              <MaterialCommunityIcons name="lightning-bolt" size={12} color="#FFFFFF" />
              <Text style={styles.magazineBadgeText}>ใหม่ล่าสุด</Text>
            </View>
          ) : isNew ? (
            <View style={[styles.magazineBadge, styles.newBadgeBg]}>
              <MaterialCommunityIcons name="fire" size={12} color="#FFFFFF" />
              <Text style={styles.magazineBadgeText}>ข่าวใหม่</Text>
            </View>
          ) : null}

          {article.readingTime ? (
            <View style={styles.readingTimeBadge}>
              <MaterialCommunityIcons name="clock-time-four-outline" size={11} color="#FFFFFF" />
              <Text style={styles.readingTimeText}>{article.readingTime} นาที</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.body}>
        <View style={styles.magazineTitleRow}>
          {!article.imageUrl && (
            <>
              {isFresh ? (
                <View style={[styles.compactBadge, styles.freshBadgeBg, { marginBottom: 6 }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={11} color="#FFFFFF" />
                  <Text style={styles.compactBadgeText}>ใหม่ล่าสุด</Text>
                </View>
              ) : isNew ? (
                <View style={[styles.compactBadge, styles.newBadgeBg, { marginBottom: 6 }]}>
                  <MaterialCommunityIcons name="fire" size={11} color="#FFFFFF" />
                  <Text style={styles.compactBadgeText}>ข่าวใหม่</Text>
                </View>
              ) : null}
            </>
          )}

          <Text
            numberOfLines={2}
            style={[
              styles.title,
              {
                color: isRead ? colors.muted : colors.text,
                fontSize: 16.5 * scale,
                fontWeight: isRead ? '600' : '800',
                lineHeight: 23 * scale,
              },
            ]}
          >
            {article.title}
          </Text>
        </View>

        {article.description ? (
          <Text numberOfLines={2} style={[styles.description, { color: colors.muted, fontSize: 13 * scale }]}>
            {article.description}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          <View style={styles.metaInfoWrap}>
            {isRead && (
              <View style={styles.readTag}>
                <MaterialCommunityIcons name="check" size={12} color={colors.muted} />
                <Text style={[styles.readTagText, { color: colors.muted, fontSize: 11 * scale }]}>
                  อ่านแล้ว
                </Text>
                <Text style={{ color: colors.muted, marginHorizontal: 3 }}>·</Text>
              </View>
            )}

            {article.author ? (
              <Text numberOfLines={1} style={[styles.author, { color: colors.primary, fontSize: 11.5 * scale }]}>
                {article.author}
              </Text>
            ) : null}
            {article.publishedMillis ? (
              <Text numberOfLines={1} style={[styles.date, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {article.author ? ' · ' : ''}
                {formatRelative(article.publishedMillis)}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel={isBookmarked ? 'ยกเลิกบันทึกข่าว' : 'บันทึกข่าว'}
            hitSlop={10}
            onPress={(event) => {
              event.stopPropagation();
              onToggleBookmark();
            }}
            style={[
              styles.bookmarkBtn,
              {
                backgroundColor: isBookmarked ? colors.primary : colors.surfaceVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isBookmarked ? '#FFFFFF' : colors.muted}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // --- Magazine (รูป 2) Styles ---
  card: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    marginBottom: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  imageContainer: {
    height: 180,
    position: 'relative',
    width: '100%',
  },
  image: {
    backgroundColor: '#E2E8F0',
    height: '100%',
    width: '100%',
  },
  magazineBadge: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 3,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    position: 'absolute',
    top: 10,
  },
  freshBadgeBg: {
    backgroundColor: '#EF4444',
  },
  newBadgeBg: {
    backgroundColor: '#F97316',
  },
  magazineBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  readingTimeBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderRadius: 999,
    bottom: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    position: 'absolute',
    right: 10,
  },
  readingTimeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  body: {
    padding: 16,
  },
  magazineTitleRow: {
    marginBottom: 2,
  },
  title: {
    letterSpacing: -0.2,
  },
  description: {
    lineHeight: 18,
    marginTop: 6,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metaInfoWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 10,
  },
  readTag: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  readTagText: {
    fontWeight: '600',
  },
  author: {
    fontWeight: '700',
  },
  date: {
    fontWeight: '500',
  },
  bookmarkBtn: {
    alignItems: 'center',
    borderRadius: 999,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },

  // --- Compact (รูป 1) Styles ---
  compactCard: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 2,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  compactLeft: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactTitleRow: {
    flex: 1,
  },
  compactBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 4,
    flexDirection: 'row',
    gap: 2.5,
    marginBottom: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compactBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  compactTitle: {
    letterSpacing: -0.2,
  },
  compactMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  compactMetaTextWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
  },
  compactAuthor: {
    fontWeight: '700',
  },
  compactDate: {
    fontWeight: '500',
  },
  compactBookmarkBtn: {
    padding: 2,
  },
  compactImageWrap: {
    alignItems: 'center',
    borderRadius: 12,
    height: 76,
    justifyContent: 'center',
    marginLeft: 12,
    overflow: 'hidden',
    width: 106,
  },
  compactImage: {
    backgroundColor: '#E2E8F0',
    height: '100%',
    width: '100%',
  },
});
