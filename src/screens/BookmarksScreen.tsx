import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NewsCard } from '../components/NewsCard';
import { ScreenState } from '../components/ScreenState';
import { BookmarkListSkeleton } from '../components/SkeletonCard';
import { showInterstitialAndNavigate } from '../services/interstitialService';
import { useNews } from '../store/NewsContext';
import { RootStackParamList } from '../types';

export function BookmarksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    bookmarks,
    toggleBookmark,
    clearBookmarks,
    syncCloudBookmarks,
    isSyncingBookmarks,
    colors,
    scale,
    isDark,
    settings,
  } = useNews();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(new Date());
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  // Sync with Supabase on screen focus
  useFocusEffect(
    useCallback(() => {
      void syncCloudBookmarks().then((res) => {
        if (res.success) {
          setLastSyncedTime(new Date());
        }
      });
    }, [syncCloudBookmarks]),
  );

  // Base sorted articles
  const allArticles = useMemo(() => {
    return Object.values(bookmarks).sort(
      (a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0),
    );
  }, [bookmarks]);

  // Extract unique publisher/source chips
  const availableSources = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of allArticles) {
      const name = a.author?.split('·')[0]?.trim() || a.author?.trim() || 'ทั่วไป';
      counts[name] = (counts[name] || 0) + 1;
    }
    const sources = Object.keys(counts).map((key) => ({
      key,
      label: key,
      count: counts[key],
    }));
    return [{ key: 'all', label: 'ทั้งหมด', count: allArticles.length }, ...sources];
  }, [allArticles]);

  // Filtered articles based on search and selected source chip
  const filteredArticles = useMemo(() => {
    let list = allArticles;

    // Filter by source
    if (selectedSource !== 'all') {
      list = list.filter((a) => {
        const name = a.author?.split('·')[0]?.trim() || a.author?.trim() || 'ทั่วไป';
        return name === selectedSource;
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.author && a.author.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [allArticles, selectedSource, searchQuery]);

  // Sync down action
  const handleSyncDown = useCallback(
    async (triggerSkeleton = false) => {
      if (triggerSkeleton) {
        setIsManualSyncing(true);
      }
      try {
        const res = await syncCloudBookmarks();
        if (res.success) {
          setLastSyncedTime(new Date());
          setSyncFeedback(`✓ ดึงข้อมูลสำเร็จ! พบ ${res.count} ข่าวจาก Supabase`);
        } else {
          setSyncFeedback('⚠️ ไม่สามารถเชื่อมต่อ Supabase ได้ โปรดลองใหม่อีกครั้ง');
        }
      } finally {
        if (triggerSkeleton) {
          setIsManualSyncing(false);
        }
      }
      setTimeout(() => {
        setSyncFeedback(null);
      }, 3500);
    },
    [syncCloudBookmarks],
  );

  // Clear all confirmation alert
  const handleConfirmClearAll = () => {
    if (allArticles.length === 0) return;
    Alert.alert(
      'ล้างข่าวที่บันทึกทั้งหมด',
      `คุณต้องการลบข่าวที่บันทึกไว้ทั้งหมด (${allArticles.length} รายการ) ออกจากเครื่องและ Supabase Cloud ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบทั้งหมด',
          style: 'destructive',
          onPress: () => {
            clearBookmarks();
            setSelectedSource('all');
            setSearchQuery('');
            setSyncFeedback('✓ ล้างข่าวที่บันทึกทั้งหมดเรียบร้อยแล้ว');
            setTimeout(() => setSyncFeedback(null), 3500);
          },
        },
      ],
    );
  };

  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'ยังไม่เคยซิงค์';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `วันนี้ ${hours}:${minutes} น.`;
  };

  // Header showing Supabase Cloud status, sync button, search, and source filter chips
  const renderListHeader = () => (
    <View style={styles.syncHeaderWrap}>
      {/* 1. Main Cloud Sync Card Banner */}
      <View
        style={[
          styles.syncBanner,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : '#F1F5F9',
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.syncBannerLeft}>
          <View
            style={[
              styles.cloudIconBadge,
              { backgroundColor: isDark ? 'rgba(14, 165, 233, 0.18)' : '#E0F2FE' },
            ]}
          >
            <MaterialCommunityIcons name="cloud-check" size={20} color="#0284C7" />
          </View>
          <View style={styles.syncTextWrap}>
            <View style={styles.syncTitleRow}>
              <Text style={[styles.syncTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                Supabase Cloud
              </Text>
              {/* Offline Ready Badge */}
              <View style={[styles.offlineBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.18)' : '#ECFDF5' }]}>
                <MaterialCommunityIcons name="check-decagram" size={11} color="#10B981" />
                <Text style={styles.offlineBadgeText}>พร้อมอ่านออฟไลน์</Text>
              </View>
            </View>

            {/* Last Synced Timestamp */}
            <Text style={[styles.syncSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
              {allArticles.length > 0 ? `${allArticles.length} ข่าว · ` : ''}
              ซิงค์ล่าสุด: {formatSyncTime(lastSyncedTime)}
            </Text>
          </View>
        </View>

        {/* Action Buttons: Sync Down & Clear All */}
        <View style={styles.bannerActions}>
          <Pressable
            onPress={() => void handleSyncDown(true)}
            disabled={isSyncingBookmarks}
            style={({ pressed }) => [
              styles.syncDownBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isSyncingBookmarks ? 0.75 : 1,
              },
            ]}
            accessibilityLabel="ดึงข่าวลงจาก Supabase"
          >
            {isSyncingBookmarks ? (
              <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 4 }} />
            ) : (
              <MaterialCommunityIcons
                name="cloud-download-outline"
                size={15}
                color="#FFFFFF"
                style={{ marginRight: 4 }}
              />
            )}
            <Text style={[styles.syncDownBtnText, { fontSize: 12 * scale }]}>
              {isSyncingBookmarks ? 'กำลังดึง...' : 'ดึงข่าวลง'}
            </Text>
          </Pressable>

          {allArticles.length > 0 && (
            <Pressable
              onPress={handleConfirmClearAll}
              disabled={isSyncingBookmarks}
              hitSlop={8}
              style={({ pressed }) => [
                styles.clearAllBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="ล้างข่าวที่บันทึกทั้งหมด"
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>

      {/* 2. Sync Feedback Toast Banner */}
      {syncFeedback && (
        <View
          style={[
            styles.feedbackBanner,
            { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' },
          ]}
        >
          <Text
            style={[
              styles.feedbackText,
              { color: isDark ? '#34D399' : '#059669', fontSize: 12 * scale },
            ]}
          >
            {syncFeedback}
          </Text>
        </View>
      )}

      {/* 3. Search Bar inside Bookmarks (Shown when there are articles) */}
      {allArticles.length > 0 && (
        <View
          style={[
            styles.searchBar,
            {
              backgroundColor: colors.surfaceVariant,
              borderColor: colors.border,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={19} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="ค้นหาในข่าวที่บันทึกไว้..."
            placeholderTextColor={colors.muted}
            style={[styles.searchInput, { color: colors.text, fontSize: 13.5 * scale }]}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={17} color={colors.muted} />
            </Pressable>
          )}
        </View>
      )}

      {/* 4. Source Filter Chips (Shown when there are multiple sources) */}
      {allArticles.length > 1 && availableSources.length > 2 && (
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

  // 1. Loading Skeleton State when calling Supabase API and waiting for load
  if (isManualSyncing || (isSyncingBookmarks && !allArticles.length)) {
    return (
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: 150 + insets.bottom }]}
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        {renderListHeader()}
        <BookmarkListSkeleton count={6} />
      </ScrollView>
    );
  }

  // 2. Empty State (no articles and not currently syncing)
  if (!allArticles.length && !isSyncingBookmarks) {
    return (
      <ScrollView
        contentContainerStyle={[styles.emptyScroll, { paddingBottom: 150 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={isSyncingBookmarks}
            onRefresh={() => void handleSyncDown(false)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderListHeader()}
        <View style={styles.emptyWrap}>
          <ScreenState
            icon="bookmark-outline"
            title="ยังไม่มีข่าวที่บันทึก"
            subtitle="แตะไอคอนบุ๊กมาร์กบนข่าวที่สนใจ หรือกดปุ่มด้านล่างเพื่อดึงข่าวทั้งหมดจาก Supabase Cloud"
          />
          <Pressable
            onPress={() => void handleSyncDown(true)}
            disabled={isSyncingBookmarks}
            style={({ pressed }) => [
              styles.emptyActionBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed || isSyncingBookmarks ? 0.8 : 1,
              },
            ]}
          >
            {isSyncingBookmarks ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#FFFFFF" />
            )}
            <Text style={[styles.emptyActionBtnText, { fontSize: 13.5 * scale }]}>
              {isSyncingBookmarks ? 'กำลังดึงข่าวจาก Supabase...' : '📥 ดึงข่าวทั้งหมดจาก Supabase Cloud'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <FlatList
      key={settings.cardLayout === 'grid' ? 'grid-bookmarks-2cols' : 'list-bookmarks-1col'}
      numColumns={settings.cardLayout === 'grid' ? 2 : 1}
      columnWrapperStyle={settings.cardLayout === 'grid' ? styles.gridColumnWrap : undefined}
      data={filteredArticles}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderListHeader}
      contentContainerStyle={[
        styles.list,
        { paddingBottom: 150 + insets.bottom },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isSyncingBookmarks}
          onRefresh={() => void handleSyncDown(false)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        isSyncingBookmarks ? (
          <BookmarkListSkeleton count={5} />
        ) : (
          <View style={styles.searchEmptyWrap}>
            <MaterialCommunityIcons name="magnify-close" size={42} color={colors.muted} />
            <Text style={[styles.searchEmptyTitle, { color: colors.text, fontSize: 15 * scale }]}>
              ไม่พบข่าวที่ตรงกับคำค้นหา
            </Text>
            <Text style={[styles.searchEmptySub, { color: colors.muted, fontSize: 12.5 * scale }]}>
              ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองสำนักข่าวอื่น
            </Text>
            <Pressable
              onPress={() => {
                setSearchQuery('');
                setSelectedSource('all');
              }}
              style={[styles.resetFilterBtn, { backgroundColor: colors.surfaceVariant }]}
            >
              <Text style={[styles.resetFilterBtnText, { color: colors.primary, fontSize: 12 * scale }]}>
                ล้างตัวกรองทั้งหมด
              </Text>
            </Pressable>
          </View>
        )
      }
      renderItem={({ item }) => (
        <View style={settings.cardLayout === 'grid' ? styles.gridItemWrapper : undefined}>
          <NewsCard
            article={item}
            isBookmarked
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => {
              void showInterstitialAndNavigate(() => {
                navigation.navigate('Article', { articleId: item.id, article: item });
              });
            }}
          />
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridColumnWrap: {
    gap: 10,
    justifyContent: 'space-between',
  },
  gridItemWrapper: {
    flex: 1,
  },
  emptyScroll: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  emptyWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  syncHeaderWrap: {
    marginBottom: 8,
    marginTop: 4,
  },
  syncBanner: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  syncBannerLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  cloudIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  syncTextWrap: {
    flex: 1,
  },
  syncTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  syncTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  offlineBadge: {
    alignItems: 'center',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  offlineBadgeText: {
    color: '#10B981',
    fontSize: 9.5,
    fontWeight: '700',
  },
  syncSub: {
    marginTop: 2,
  },
  bannerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  syncDownBtn: {
    alignItems: 'center',
    borderRadius: 9,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6.5,
  },
  syncDownBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  clearAllBtn: {
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 9,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  feedbackBanner: {
    borderRadius: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  feedbackText: {
    fontWeight: '600',
    textAlign: 'center',
  },
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
  emptyActionBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchEmptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 48,
  },
  searchEmptyTitle: {
    fontWeight: '700',
    marginTop: 4,
  },
  searchEmptySub: {
    textAlign: 'center',
  },
  resetFilterBtn: {
    borderRadius: 12,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  resetFilterBtnText: {
    fontWeight: '700',
  },
});
