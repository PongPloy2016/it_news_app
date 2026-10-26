import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ScreenState } from '../../../components/ScreenState';
import { BookmarksViewModel } from '../types';

interface BookmarksEmptyViewProps {
  vm: BookmarksViewModel;
  header: React.ReactNode;
}

export function BookmarksEmptyView({ vm, header }: BookmarksEmptyViewProps) {
  const { isSyncingBookmarks, handleSyncDown, colors, scale, insets } = vm;

  return (
    <ScrollView
      contentContainerStyle={[styles.emptyScroll, { paddingBottom: 150 + insets.bottom }]}
    >
      {header}
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

const styles = StyleSheet.create({
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
});
