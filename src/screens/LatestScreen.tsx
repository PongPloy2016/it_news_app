import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { FEED_GROUPS } from '../config';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';
import { formatRelative } from '../utils/content';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const PAGE_SIZE = 10;

export function LatestScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const {
    articles, bookmarks, colors, scale, isHydrated, isRefreshing, hasFetchError,
    isShowingCachedFeed, lastUpdated, refresh, selectedFeed, selectedFeedKey,
    setSelectedFeedKey, toggleBookmark,
  } = useNews();

  const activeGroup = useMemo(
    () => FEED_GROUPS.find((group) => group.sources.some((item) => item.key === selectedFeedKey)) ?? FEED_GROUPS[0],
    [selectedFeedKey],
  );
  const [activeGroupKey, setActiveGroupKey] = useState(activeGroup.key);

  useEffect(() => {
    setVisibleCount((current) => Math.min(Math.max(current, PAGE_SIZE), articles.length || PAGE_SIZE));
  }, [articles.length]);

  useEffect(() => {
    const matchedGroup = FEED_GROUPS.find((group) => group.sources.some((item) => item.key === selectedFeedKey));
    if (matchedGroup) setActiveGroupKey(matchedGroup.key);
  }, [selectedFeedKey]);

  const visibleArticles = articles.slice(0, visibleCount);
  const hasMore = visibleCount < articles.length;
  const activeSources = activeGroup.sources;

  if (selectedFeed.type === 'html') {
    return (
      <View style={[styles.htmlScreen, { backgroundColor: colors.background }]}> 
        <View style={[styles.mainTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
          {FEED_GROUPS.map((group) => {
            const active = group.key === activeGroupKey;
            return (
              <Pressable
                key={group.key}
                onPress={() => {
                  setActiveGroupKey(group.key);
                  const firstFeed = group.sources[0];
                  if (firstFeed) setSelectedFeedKey(firstFeed.key);
                }}
                style={[styles.mainTabButton, active && { backgroundColor: withAlpha(group.color, 0.08) }]}
              >
                <Text style={[styles.tabLabel, { color: active ? group.color : colors.muted, fontSize: 13 * scale }]}>{group.label}</Text>
                {active ? <View style={[styles.tabIndicator, { backgroundColor: group.color }]} /> : null}
              </Pressable>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subTabBar}
          style={styles.subTabBarWrap}
        >
          {activeSources.map((feed) => {
            const active = feed.key === selectedFeedKey;
            const groupColor = activeGroup.color;
            return (
              <Pressable
                key={feed.key}
                onPress={() => setSelectedFeedKey(feed.key)}
                style={[
                  styles.subTabItem,
                  {
                    backgroundColor: active ? withAlpha(groupColor, 0.12) : colors.surface,
                    borderColor: active ? groupColor : colors.border,
                  },
                ]}
              >
                <Text style={[styles.subTabLabel, { color: active ? groupColor : colors.text, fontSize: 11.5 * scale }]}>{feed.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.webViewWrap}> 
          <WebView
            source={{ uri: selectedFeed.url }}
            startInLoadingState
            renderLoading={() => (
              <View style={styles.webViewLoading}> 
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          />
        </View>
      </View>
    );
  }

  if (!isHydrated || (isRefreshing && !articles.length)) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.loading, { color: colors.muted, fontSize: 14 * scale }]}>กำลังโหลดข่าวล่าสุด…</Text>
    </View>;
  }
  if (hasFetchError && !articles.length) {
    return <ScreenState icon="cloud-alert-outline" title="โหลดข่าวไม่สำเร็จ"
      subtitle="ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตแล้วลองอีกครั้ง" actionLabel="ลองใหม่" onAction={() => void refresh()} />;
  }

  return (
    <FlatList
      data={visibleArticles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.list, { paddingBottom: 120 + insets.bottom }]}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void refresh()} tintColor={colors.primary} />}
      onEndReached={
        () => {
          if (!isRefreshing && hasMore) {
            setVisibleCount((current) => Math.min(current + PAGE_SIZE, articles.length));
          }
        }
      }
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View>
          <View style={[styles.mainTabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}> 
            {FEED_GROUPS.map((group) => {
              const active = group.key === activeGroupKey;
              return (
                <Pressable
                  key={group.key}
                  onPress={() => {
                    setActiveGroupKey(group.key);
                    const firstFeed = group.sources[0];
                    if (firstFeed) setSelectedFeedKey(firstFeed.key);
                  }}
                  style={[
                    styles.mainTabButton,
                    active && {
                      backgroundColor: withAlpha(group.color, 0.08),
                    },
                  ]}
                >
                  <Text style={[
                    styles.tabLabel,
                    {
                      color: active ? group.color : colors.muted,
                      fontSize: 13 * scale,
                    },
                  ]}>{group.label}</Text>
                  {active ? <View style={[styles.tabIndicator, { backgroundColor: group.color }]} /> : null}
                </Pressable>
              );
            })}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subTabBar}
            style={styles.subTabBarWrap}
          >
            {activeSources.map((feed) => {
              const active = feed.key === selectedFeedKey;
              const groupColor = activeGroup.color;
              return (
                <Pressable
                  key={feed.key}
                  onPress={() => setSelectedFeedKey(feed.key)}
                  style={[
                    styles.subTabItem,
                    {
                      backgroundColor: active ? withAlpha(groupColor, 0.12) : colors.surface,
                      borderColor: active ? groupColor : colors.border,
                    },
                  ]}
                >
                  <Text style={[
                    styles.subTabLabel,
                    {
                      color: active ? groupColor : colors.text,
                      fontSize: 11.5 * scale,
                    },
                  ]}>{feed.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {isShowingCachedFeed ? (
            <View style={[styles.banner, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.bannerText, { color: colors.muted, fontSize: 13 * scale }]}>ออฟไลน์ — กำลังแสดงข่าวที่บันทึกไว้</Text>
            </View>
          ) : null}
          <View style={styles.headingRow}>
            <View>
              <Text style={[styles.heading, { color: colors.text, fontSize: 25 * scale }]}>ข่าวล่าสุด</Text>
              <Text style={[styles.updated, { color: colors.muted, fontSize: 12 * scale }]}>
                {selectedFeed.label} · {lastUpdated ? `อัปเดต ${formatRelative(lastUpdated)}` : 'ดึงลงเพื่อรีเฟรช'}
              </Text>
            </View>
            <View style={[styles.count, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{articles.length}</Text>
            </View>
          </View>
        </View>
      }
      ListFooterComponent={
        hasMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <NewsCard article={item} isBookmarked={Boolean(bookmarks[item.id])}
          onToggleBookmark={() => toggleBookmark(item)}
          onPress={() => navigation.navigate('Article', { articleId: item.id })} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { marginTop: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 96 },
  htmlScreen: { flex: 1 },
  webViewWrap: { flex: 1, minHeight: 320 },
  webViewLoading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.65)' },
  tabBarWrap: { marginBottom: 8, maxHeight: 52 },
  mainTabBar: { borderBottomWidth: 1, flexDirection: 'row', marginBottom: 10 },
  mainTabButton: { alignItems: 'center', flex: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 8, paddingTop: 10 },
  tabLabel: { fontWeight: '700', textAlign: 'center' },
  tabIndicator: { borderRadius: 999, height: 3, marginTop: 8, width: '70%' },
  subTabBarWrap: { marginBottom: 10, maxHeight: 42 },
  subTabBar: { gap: 8, paddingVertical: 2 },
  subTabItem: { alignItems: 'center', borderRadius: 999, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 7 },
  subTabLabel: { fontWeight: '700' },
  banner: { borderRadius: 12, marginBottom: 12, padding: 12 },
  bannerText: { textAlign: 'center' },
  headingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  heading: { fontWeight: '800' },
  updated: { marginTop: 4 },
  count: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', minWidth: 36, paddingHorizontal: 10 },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
});
