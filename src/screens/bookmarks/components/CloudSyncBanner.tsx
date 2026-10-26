import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { BookmarksViewModel } from '../types';

export function CloudSyncBanner({ vm }: { vm: BookmarksViewModel }) {
  const {
    allArticles,
    isCloudSyncActive,
    setCloudSyncEnabled,
    isManualSyncing,
    isSyncingBookmarks,
    lastSyncedTime,
    remoteSettings,
    colors,
    scale,
    handleSyncDown,
    handleConfirmClearAll,
  } = vm;

  const formatSyncTime = (date: Date | null) => {
    if (!date) return 'ยังไม่เคยซิงค์';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `วันนี้ ${hours}:${minutes} น.`;
  };

  return (
    <View style={styles.syncHeaderWrap}>
      <View
        style={[
          styles.syncBanner,
          {
            backgroundColor: isCloudSyncActive
              ? 'rgba(2, 132, 199, 0.08)'
              : colors.surfaceVariant,
            borderColor: isCloudSyncActive ? '#0284C7' : colors.border,
          },
        ]}
      >
        <View style={styles.syncBannerLeft}>
          <View
            style={[
              styles.cloudIconBadge,
              {
                backgroundColor: isCloudSyncActive
                  ? 'rgba(2, 132, 199, 0.16)'
                  : colors.surface,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isCloudSyncActive ? 'cloud-check' : 'cloud-off-outline'}
              size={20}
              color={isCloudSyncActive ? '#0284C7' : colors.muted}
            />
          </View>
          <View style={styles.syncTextWrap}>
            <View style={styles.syncTitleRow}>
              <Text style={[styles.syncTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                Supabase Cloud Sync
              </Text>
              {isCloudSyncActive ? (
                <View style={[styles.offlineBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#10B981' }} />
                  <Text style={styles.offlineBadgeText}>เชื่อมต่อแล้ว</Text>
                </View>
              ) : (
                <View style={[styles.offlineBadge, { backgroundColor: 'rgba(148, 163, 184, 0.2)' }]}>
                  <Text style={[styles.offlineBadgeText, { color: colors.muted }]}>ออฟไลน์</Text>
                </View>
              )}
            </View>
            <Text style={[styles.syncSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
              {isCloudSyncActive
                ? `ซิงค์อัตโนมัติ (${formatSyncTime(lastSyncedTime)})`
                : 'บันทึกเฉพาะในเครื่องนี้ ไม่ได้ซิงค์ขึ้น Cloud'}
            </Text>
          </View>
        </View>

        <View style={styles.bannerActions}>
          <Switch
            value={isCloudSyncActive}
            onValueChange={setCloudSyncEnabled}
            trackColor={{ false: '#475569', true: '#0284C7' }}
            thumbColor={isCloudSyncActive ? '#FFFFFF' : '#94A3B8'}
          />

          {isCloudSyncActive && (
            <Pressable
              onPress={() => void handleSyncDown(false)}
              disabled={isManualSyncing || isSyncingBookmarks}
              style={({ pressed }) => [
                styles.syncDownBtn,
                {
                  backgroundColor: '#0284C7',
                  opacity: pressed || isManualSyncing || isSyncingBookmarks ? 0.7 : 1,
                },
              ]}
              accessibilityLabel="ดึงข่าวทั้งหมดจาก Cloud ลงมาที่เครื่อง"
            >
              {isManualSyncing ? (
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
          )}

          {allArticles.length > 0 && remoteSettings.clear_bookmarks_enabled !== false && (
            <Pressable
              onPress={handleConfirmClearAll}
              disabled={isSyncingBookmarks}
              hitSlop={8}
              style={({ pressed }) => [
                styles.clearAllBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}
              accessibilityLabel="ล้างข่าวที่บันทึกในเครื่อง"
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
