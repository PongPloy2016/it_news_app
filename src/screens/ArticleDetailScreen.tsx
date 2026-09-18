import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiReaderCard } from '../components/AiReaderCard';
import { ScreenState } from '../components/ScreenState';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';
import { generateAiSummary } from '../utils/aiSummary';
import { formatRelative, stripHtml } from '../utils/content';
import { speakArticleText, stopSpeaking } from '../utils/speech';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { articles, bookmarks, colors, scale, toggleBookmark, isDark, settings } = useNews();
  const isAiEnabled = settings.aiReaderEnabled;
  const [readerMode, setReaderMode] = useState<'ai' | 'full'>('ai');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);

  const article =
    articles.find((item) => item.id === route.params.articleId) ??
    bookmarks[route.params.articleId];

  // Stop speaking when leaving the screen
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const aiSummary = useMemo(() => {
    if (!article) return null;
    return generateAiSummary(article.title, article.content || article.description);
  }, [article]);

  if (!article || !aiSummary) {
    return (
      <ScreenState
        icon="newspaper-remove"
        title="ไม่พบข่าวนี้"
        subtitle="ข่าวอาจถูกลบออกจากแคชแล้ว ลองกลับไปหน้ารายการและเปิดใหม่อีกครั้ง"
      />
    );
  }

  const bookmarked = Boolean(bookmarks[article.id]);

  const handleQuickVoicePlay = () => {
    if (isVoicePlaying) {
      stopSpeaking();
      setIsVoicePlaying(false);
    } else {
      setIsVoicePlaying(true);
      speakArticleText(aiSummary.speechScript, {
        onDone: () => setIsVoicePlaying(false),
        onStopped: () => setIsVoicePlaying(false),
        onError: () => setIsVoicePlaying(false),
      });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {article.imageUrl ? (
        <View style={styles.imageWrap}>
          <Image source={{ uri: article.imageUrl }} style={styles.image} resizeMode="cover" />
        </View>
      ) : null}

      <View style={styles.body}>
        {/* News Headline Title */}
        <Text style={[styles.title, { color: colors.text, fontSize: 23 * scale, lineHeight: 32 * scale }]}>
          {article.title}
        </Text>

        {/* Metadata (Author, Time, Read Duration) */}
        <Text style={[styles.meta, { color: colors.muted, fontSize: 13 * scale }]}>
          {[article.author, formatRelative(article.publishedMillis), `อ่าน ${article.readingTime} นาที`]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        {/* Action Buttons Row (Bookmark, Share, Listen with AI) */}
        <View style={styles.actions}>
          <Pressable
            hitSlop={8}
            onPress={() => toggleBookmark(article)}
            style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <MaterialCommunityIcons
              name={bookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.actionText, { color: colors.text, fontSize: 13 * scale }]}>
              {bookmarked ? 'บันทึกแล้ว' : 'บันทึก'}
            </Text>
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={() => void Share.share({ message: `${article.title}\n${article.link}` })}
            style={[styles.actionButton, { backgroundColor: colors.surfaceVariant }]}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.text, fontSize: 13 * scale }]}>
              แชร์
            </Text>
          </Pressable>

          {isAiEnabled && (
            <Pressable
              hitSlop={8}
              onPress={handleQuickVoicePlay}
              style={[
                styles.actionButton,
                styles.aiVoiceButton,
                {
                  backgroundColor: isVoicePlaying ? '#EF4444' : '#6366F1',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isVoicePlaying ? 'pause-circle' : 'volume-high'}
                size={20}
                color="#FFFFFF"
              />
              <Text style={[styles.actionText, { color: '#FFFFFF', fontSize: 13 * scale }]}>
                {isVoicePlaying ? 'หยุดฟัง' : 'ฟังเสียง AI'}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Reader Mode Switcher Tabs (AI Smart Reader vs Original Full Text) */}
        {isAiEnabled ? (
          <>
            <View style={[styles.modeTabsWrap, { backgroundColor: colors.surfaceVariant }]}>
              <Pressable
                onPress={() => setReaderMode('ai')}
                style={[
                  styles.modeTab,
                  readerMode === 'ai' && [
                    styles.modeTabActive,
                    { backgroundColor: isDark ? '#4F46E5' : '#6366F1' },
                  ],
                ]}
              >
                <MaterialCommunityIcons
                  name="creation"
                  size={16}
                  color={readerMode === 'ai' ? '#FFFFFF' : colors.muted}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color: readerMode === 'ai' ? '#FFFFFF' : colors.muted,
                      fontWeight: readerMode === 'ai' ? '800' : '600',
                      fontSize: 13 * scale,
                    },
                  ]}
                >
                  โหมดอ่านแบบ AI
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setReaderMode('full')}
                style={[
                  styles.modeTab,
                  readerMode === 'full' && [
                    styles.modeTabActive,
                    { backgroundColor: colors.surface },
                  ],
                ]}
              >
                <MaterialCommunityIcons
                  name="newspaper-variant-outline"
                  size={16}
                  color={readerMode === 'full' ? colors.primary : colors.muted}
                />
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color: readerMode === 'full' ? colors.text : colors.muted,
                      fontWeight: readerMode === 'full' ? '800' : '600',
                      fontSize: 13 * scale,
                    },
                  ]}
                >
                  เนื้อหาข่าวต้นฉบับ
                </Text>
              </Pressable>
            </View>

            {readerMode === 'ai' ? (
              <AiReaderCard summary={aiSummary} articleTitle={article.title} />
            ) : (
              <View style={styles.originalContentWrap}>
                <Text style={[styles.description, { color: colors.text, fontSize: 16 * scale, lineHeight: 28 * scale }]}>
                  {article.description || stripHtml(article.content)}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.originalContentWrap}>
            <Text style={[styles.description, { color: colors.text, fontSize: 16 * scale, lineHeight: 28 * scale }]}>
              {article.description || stripHtml(article.content)}
            </Text>
          </View>
        )}

        {/* Open Original Source Web Link Button */}
        <Pressable
          hitSlop={8}
          onPress={() => navigation.navigate('WebView', { url: article.link, title: article.title })}
          style={[styles.openButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.openText, { color: colors.onPrimary, fontSize: 15 * scale }]}>
            เปิดอ่านข่าวต้นฉบับฉบับเต็ม
          </Text>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.onPrimary} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  imageWrap: {
    height: 240,
    width: '100%',
    backgroundColor: '#D7DBE4',
  },
  image: {
    height: '100%',
    width: '100%',
  },
  body: {
    padding: 18,
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  meta: {
    fontWeight: '500',
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  actionText: {
    fontWeight: '700',
  },
  aiVoiceButton: {
    marginLeft: 'auto',
  },
  modeTabsWrap: {
    borderRadius: 14,
    flexDirection: 'row',
    marginTop: 20,
    padding: 4,
  },
  modeTab: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  modeTabActive: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  modeTabText: {},
  originalContentWrap: {
    marginTop: 18,
  },
  description: {
    letterSpacing: 0.1,
  },
  openButton: {
    alignItems: 'center',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    padding: 15,
  },
  openText: {
    fontWeight: '800',
    marginRight: 8,
  },
});
