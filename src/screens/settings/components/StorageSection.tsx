import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { styles } from '../styles';
import { SettingsViewModel } from '../types';
import { Section } from './Section';

interface StorageSectionProps {
  vm: SettingsViewModel;
}

export function StorageSection({ vm }: StorageSectionProps) {
  const {
    colors,
    scale,
    isDark,
    remoteSettings,
    isCloudSyncActive,
    readCount,
    historyCount,
    cacheCount,
    bookmarkCount,
    clearReadArticles,
    clearSearchHistory,
    clearNewsCache,
    clearBookmarks,
    t,
  } = vm;

  return (
    <Section
      icon="database-outline"
      gradientColors={['#EC4899', '#BE185D']}
      title={t.section_storage}
      subtitle={t.section_storage_sub}
      isDark={isDark}
      colors={colors}
      scale={scale}
    >
      {/* Metric Overview Badges with Vibrant Circular Icons */}
      <View style={styles.metricsGrid}>
        <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
          <LinearGradient
            colors={['#3B82F6', '#1D4ED8']}
            style={styles.metricIconCircle}
          >
            <MaterialCommunityIcons name="eye-check-outline" size={14} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
            {readCount}
          </Text>
          <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_read}</Text>
        </View>

        <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
          <LinearGradient
            colors={['#8B5CF6', '#6D28D9']}
            style={styles.metricIconCircle}
          >
            <MaterialCommunityIcons name="history" size={14} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
            {historyCount}
          </Text>
          <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_search}</Text>
        </View>

        <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.metricIconCircle}
          >
            <MaterialCommunityIcons name="folder-text-outline" size={14} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
            {cacheCount}
          </Text>
          <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_cache}</Text>
        </View>

        <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
          <LinearGradient
            colors={['#EC4899', '#BE185D']}
            style={styles.metricIconCircle}
          >
            <MaterialCommunityIcons name="bookmark-outline" size={14} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
            {bookmarkCount}
          </Text>
          <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_bookmarks}</Text>
        </View>
      </View>

      {/* Clean Storage Action Rows */}
      <View style={styles.storageActionsList}>
        {/* Row 1: Clear Read History */}
        <View style={[styles.storageRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.storageItemTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
              {t.storage_read_title}
            </Text>
            <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
              {readCount > 0 ? t.storage_read_has.replace('{count}', String(readCount)) : t.storage_read_empty}
            </Text>
          </View>
          <Pressable
            disabled={readCount === 0}
            onPress={() => {
              Alert.alert(
                t.storage_read_title,
                t.alert_confirm_reset_read.replace('{count}', String(readCount)),
                [
                  { text: t.btn_cancel, style: 'cancel' },
                  {
                    text: t.btn_reset,
                    style: 'destructive',
                    onPress: () => {
                      void clearReadArticles();
                      Alert.alert(t.alert_success, t.alert_reset_read_success);
                    },
                  },
                ],
              );
            }}
            style={[
              styles.tablePillBtn,
              { backgroundColor: isDark ? '#1E2B40' : '#EFF6FF' },
              readCount === 0 && { opacity: 0.4 },
            ]}
          >
            <Text style={[styles.tablePillBtnText, { color: '#3B82F6', fontSize: 12 * scale }]}>
              {t.btn_reset}
            </Text>
          </Pressable>
        </View>

        {/* Row 2: Clear Search History */}
        <View style={[styles.storageRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.storageItemTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
              {t.storage_search_title}
            </Text>
            <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
              {historyCount > 0 ? t.storage_search_has.replace('{count}', String(historyCount)) : t.storage_search_empty}
            </Text>
          </View>
          <Pressable
            disabled={historyCount === 0}
            onPress={() => {
              Alert.alert(
                t.storage_search_title,
                t.alert_confirm_clear_search.replace('{count}', String(historyCount)),
                [
                  { text: t.btn_cancel, style: 'cancel' },
                  {
                    text: t.btn_clear,
                    style: 'destructive',
                    onPress: () => {
                      clearSearchHistory();
                      Alert.alert(t.alert_success, t.alert_clear_search_success);
                    },
                  },
                ],
              );
            }}
            style={[
              styles.tablePillBtn,
              { backgroundColor: isDark ? '#281E3B' : '#F5F3FF' },
              historyCount === 0 && { opacity: 0.4 },
            ]}
          >
            <Text style={[styles.tablePillBtnText, { color: '#8B5CF6', fontSize: 12 * scale }]}>
              {t.btn_clear}
            </Text>
          </Pressable>
        </View>

        {/* Row 3: Clear Cached Articles */}
        <View
          style={[
            styles.storageRowItem,
            {
              borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
              borderBottomWidth: remoteSettings.clear_bookmarks_enabled ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.storageItemTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
              {t.storage_cache_title}
            </Text>
            <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
              {cacheCount > 0 ? t.storage_cache_has.replace('{count}', String(cacheCount)) : t.storage_cache_empty}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              void clearNewsCache();
              Alert.alert(t.alert_success, t.alert_clear_cache_success);
            }}
            style={[styles.tablePillBtn, { backgroundColor: isDark ? '#2E2214' : '#FFFBEB' }]}
          >
            <Text style={[styles.tablePillBtnText, { color: '#F59E0B', fontSize: 12 * scale }]}>
              {t.btn_clear_cache}
            </Text>
          </Pressable>
        </View>

        {/* Row 4: Clear Bookmarks (Local Device Only - Never touches Cloud) */}
        {remoteSettings.clear_bookmarks_enabled !== false && (
          <View style={[styles.storageRowItem, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.storageItemTitle, { color: colors.error, fontSize: 13.5 * scale }]}>
                {t.storage_bookmarks_title}
              </Text>
              <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {bookmarkCount > 0
                  ? isCloudSyncActive
                    ? t.storage_bookmarks_cloud_sub.replace('{count}', String(bookmarkCount))
                    : t.storage_bookmarks_local_sub.replace('{count}', String(bookmarkCount))
                  : t.storage_bookmarks_empty}
              </Text>
            </View>
            <Pressable
              disabled={bookmarkCount === 0}
              onPress={() => {
                const message = t.alert_confirm_delete_bookmarks_local.replace('{count}', String(bookmarkCount));
                Alert.alert(
                  t.storage_bookmarks_title,
                  message,
                  [
                    { text: t.btn_cancel, style: 'cancel' },
                    { text: t.btn_delete_all, style: 'destructive', onPress: clearBookmarks },
                  ],
                );
              }}
              style={[
                styles.tablePillBtnDestructive,
                { backgroundColor: isDark ? '#3E1418' : '#FEE2E2', borderColor: colors.error },
                bookmarkCount === 0 && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.tablePillBtnDestructiveText, { color: colors.error, fontSize: 12 * scale }]}>
                {t.btn_delete_all}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </Section>
  );
}
