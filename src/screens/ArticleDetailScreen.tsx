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
import { AdBanner } from '../components/AdBanner';
import { AdCard } from '../components/AdCard';
import { AiReaderCard } from '../components/AiReaderCard';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { useNews } from '../store/NewsContext';
import { typography } from '../theme';
import { RootStackParamList } from '../types';
import { cleanNewsContent, generateAiSummary } from '../utils/aiSummary';
import { formatRelative, stripHtml } from '../utils/content';
import { shareArticle } from '../utils/share';
import { SpeechRate, speakArticleText, stopSpeaking } from '../utils/speech';
import { showInterstitialAndNavigate } from '../services/interstitialService';

type Props = NativeStackScreenProps<RootStackParamList, 'Article'>;

export function ArticleDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { articles, bookmarks, colors, scale, toggleBookmark, isDark, settings, selectedFeed, markAsRead } = useNews();
  const isAiEnabled = settings.aiReaderEnabled;
  const [readerMode, setReaderMode] = useState<'ai' | 'full'>(isAiEnabled ? 'ai' : 'full');
  const [isVoicePlaying, setIsVoicePlaying] = useState(false);
  const [speechRate, setSpeechRate] = useState<SpeechRate>(0.9);

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

  const otherArticles = useMemo(() => {
    if (!article) return [];
    return articles.filter((item) => item.id !== article.id).slice(0, 3);
  }, [articles, article]);

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

  const handleToggleVoice = (newRate?: SpeechRate) => {
    const rateToUse = newRate ?? speechRate;
    if (isVoicePlaying && !newRate) {
      stopSpeaking();
      setIsVoicePlaying(false);
    } else {
      setIsVoicePlaying(true);
      const textToRead =
        readerMode === 'full'
          ? `${article.title}. ${cleanNewsContent(article.content || article.description || '')}`
          : aiSummary.speechScript;

      speakArticleText(textToRead, {
        rate: rateToUse,
        onDone: () => setIsVoicePlaying(false),
        onStopped: () => setIsVoicePlaying(false),
        onError: () => setIsVoicePlaying(false),
      });
    }
  };

  const handleChangeRate = (rate: SpeechRate) => {
    setSpeechRate(rate);
    if (isVoicePlaying) {
      handleToggleVoice(rate);
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
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: 23 * scale,
              lineHeight: Math.round(23 * scale * typography.title.lineHeightMultiplier),
              fontFamily: typography.fontFamily,
            },
          ]}
        >
          {article.title}
        </Text>

        {/* Metadata (Author, Time, Read Duration) */}
        <Text
          style={[
            styles.meta,
            {
              color: colors.muted,
              fontSize: 13 * scale,
              fontFamily: typography.fontFamily,
            },
          ]}
        >
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
            onPress={() => void shareArticle(article, selectedFeed?.label)}
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
              onPress={() => handleToggleVoice()}
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
              <AiReaderCard
                summary={aiSummary}
                articleTitle={article.title}
                isPlaying={isVoicePlaying}
                onTogglePlay={() => handleToggleVoice()}
                rate={speechRate}
                onRateChange={handleChangeRate}
              />
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
            <Text
              style={[
                styles.description,
                {
                  color: colors.text,
                  fontSize: 16 * scale,
                  lineHeight: Math.round(16 * scale * typography.body.lineHeightMultiplier),
                  fontFamily: typography.fontFamily,
                },
              ]}
            >
              {article.description || stripHtml(article.content)}
            </Text>
          </View>
        )}

        {/* AdMob Banner */}
        <AdBanner style={styles.detailAdBanner} />

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

        {/* ข่าวอื่นๆ ที่น่าสนใจ (Other / Related News Section) */}
        {otherArticles.length > 0 && (
          <View style={[styles.relatedSection, { borderTopColor: colors.border }]}>
            <View style={styles.relatedHeaderRow}>
              <View style={[styles.relatedHeaderIconWrap, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons
                  name="newspaper-variant-multiple-outline"
                  size={18 * scale}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.relatedSectionTitle, { color: colors.text, fontSize: 17 * scale }]}>
                ข่าวอื่นๆ ที่น่าสนใจ
              </Text>
            </View>

            <View style={styles.relatedList}>
              {otherArticles.map((item) => (
                <NewsCard
                  key={item.id}
                  article={item}
                  isBookmarked={Boolean(bookmarks[item.id])}
                  onToggleBookmark={() => toggleBookmark(item)}
                  onPress={() => {
                    markAsRead(item.id);
                    void showInterstitialAndNavigate(() => {
                      navigation.push('Article', { articleId: item.id });
                    });
                  }}
                />
              ))}
            </View>

            {/* Ads Card ต่อจากข่าวอื่นๆ */}
            <AdCard
              title="ผู้สนับสนุนเนื้อหา"
              style={styles.relatedAdCard}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 36 },
  detailAdBanner: {
    marginVertical: 16,
    borderRadius: 8,
  },
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
  relatedSection: {
    marginTop: 32,
    borderTopWidth: 1,
    paddingTop: 22,
  },
  relatedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  relatedHeaderIconWrap: {
    padding: 6,
    borderRadius: 8,
  },
  relatedSectionTitle: {
    fontWeight: '800',
  },
  relatedList: {
    gap: 12,
  },
  relatedAdCard: {
    marginTop: 16,
  },
});
