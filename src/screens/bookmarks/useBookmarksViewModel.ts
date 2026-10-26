import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyticsService } from '../../services/analyticsService';
import { showInterstitialAndNavigate } from '../../services/interstitialService';
import { useNews } from '../../store/NewsContext';
import { NewsArticle, RootStackParamList } from '../../types';
import { BookmarksViewModel, SourceFilterItem } from './types';

export function useBookmarksViewModel(): BookmarksViewModel {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    bookmarks,
    toggleBookmark,
    clearBookmarks,
    syncCloudBookmarks,
    isSyncingBookmarks,
    isCloudSyncActive,
    setCloudSyncEnabled,
    remoteSettings,
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
  const userClearedLocalRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      void analyticsService.logScreenView('ข่าวที่บันทึกไว้', 'BookmarksScreen', {
        page_title: 'ข่าวที่บันทึกไว้',
      });
      if (!isCloudSyncActive) return;
      if (userClearedLocalRef.current) return;
      void syncCloudBookmarks().then((res) => {
        if (res.success) {
          setLastSyncedTime(new Date());
        }
      });
    }, [isCloudSyncActive, syncCloudBookmarks]),
  );

  const allArticles = useMemo(() => {
    return Object.values(bookmarks).sort(
      (a, b) => (b.publishedMillis ?? 0) - (a.publishedMillis ?? 0),
    );
  }, [bookmarks]);

  const availableSources = useMemo<SourceFilterItem[]>(() => {
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

  const filteredArticles = useMemo(() => {
    let list = allArticles;

    if (selectedSource !== 'all') {
      list = list.filter((a) => {
        const name = a.author?.split('·')[0]?.trim() || a.author?.trim() || 'ทั่วไป';
        return name === selectedSource;
      });
    }

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

  const handleSyncDown = useCallback(
    async (triggerSkeleton = false) => {
      userClearedLocalRef.current = false;
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
        setSyncFeedback(null), 3500;
      });
    },
    [syncCloudBookmarks],
  );

  const handleConfirmClearAll = useCallback(() => {
    if (allArticles.length === 0) return;
    const confirmMessage = isCloudSyncActive
      ? `คุณต้องการลบข่าวที่บันทึกไว้ทั้งหมด (${allArticles.length} รายการ) ออกจากเครื่องนี้ใช่หรือไม่?\n\n(ข้อมูลบน Cloud จะยังคงอยู่ และสามารถกดปุ่ม "ดึงข่าวลง" เพื่อนำกลับมาได้ทุกเมื่อ)`
      : `คุณต้องการลบข่าวที่บันทึกไว้ทั้งหมด (${allArticles.length} รายการ) ออกจากเครื่องนี้ใช่หรือไม่?`;
    Alert.alert(
      'ล้างข่าวที่บันทึกในเครื่อง',
      confirmMessage,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบออกจากเครื่อง',
          style: 'destructive',
          onPress: () => {
            userClearedLocalRef.current = true;
            clearBookmarks();
            setSelectedSource('all');
            setSearchQuery('');
            setSyncFeedback('✓ ลบข่าวออกจากเครื่องเรียบร้อยแล้ว (ข้อมูลบน Cloud ยังคงอยู่)');
            setTimeout(() => setSyncFeedback(null), 4000);
          },
        },
      ],
    );
  }, [allArticles.length, clearBookmarks, isCloudSyncActive]);

  const handleArticlePress = useCallback(
    (item: NewsArticle) => {
      void showInterstitialAndNavigate(() => {
        navigation.navigate('Article', {
          articleId: item.id,
          article: item,
          articles: filteredArticles,
        });
      });
    },
    [filteredArticles, navigation],
  );

  return {
    allArticles,
    filteredArticles,
    availableSources,
    selectedSource,
    setSelectedSource,
    searchQuery,
    setSearchQuery,
    isCloudSyncActive,
    setCloudSyncEnabled,
    isSyncingBookmarks,
    isManualSyncing,
    lastSyncedTime,
    syncFeedback,
    handleSyncDown,
    handleConfirmClearAll,
    handleArticlePress,
    toggleBookmark,
    colors,
    scale,
    isDark,
    insets,
    settings,
    remoteSettings,
  };
}
