import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Switch, Text, View } from 'react-native';
import { styles } from '../styles';
import { SettingsViewModel } from '../types';
import { CategoryGroupHeader } from './CategoryGroupHeader';
import { Section } from './Section';

interface CloudSyncSectionProps {
  vm: SettingsViewModel;
}

export function CloudSyncSection({ vm }: CloudSyncSectionProps) {
  const {
    colors,
    scale,
    isDark,
    remoteSettings,
    isCloudSyncActive,
    setCloudSyncEnabled,
    deviceId,
    handleShareDeviceId,
    isManualSyncing,
    isSyncingBookmarks,
    handleManualSync,
    bookmarkCount,
    setIsImportModalVisible,
    t,
  } = vm;

  return (
    <>
      {/* Category Group Header */}
      <CategoryGroupHeader
        title={t.group_sync_storage}
        color="#0284C7"
        scale={scale}
        isDark={isDark}
      />

      {/* Section 6: Supabase Cloud Sync (Controlled by remoteSettings.cloud_sync_enabled) */}
      {remoteSettings.cloud_sync_enabled !== false && (
        <Section
          icon="cloud-sync-outline"
          gradientColors={['#0284C7', '#1D4ED8']}
          title={t.section_cloud}
          subtitle={t.section_cloud_sub}
          isDark={isDark}
          colors={colors}
          scale={scale}
        >
          {/* Cloud Sync Toggle Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 10,
            }}
          >
            <View style={{ flex: 1, marginRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient
                colors={['#0284C7', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowItemIconBadge}
              >
                <MaterialCommunityIcons name="cloud-sync-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13.5 * scale }}>
                  {t.cloud_enable_title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11.5 * scale, marginTop: 2 }}>
                  {isCloudSyncActive ? t.cloud_active_desc : t.cloud_disabled_desc}
                </Text>
              </View>
            </View>
            <Switch
              value={isCloudSyncActive}
              onValueChange={setCloudSyncEnabled}
              trackColor={{ false: colors.border, true: '#0284C7' }}
              thumbColor={isCloudSyncActive ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {/* Cloud Status Row */}
          <View style={styles.cloudStatusRow}>
            <View style={styles.cloudPulseWrap}>
              <View style={styles.cloudDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cloudStatusTitle, { color: colors.text, fontSize: 13 * scale }]}>
                {t.cloud_connected}
              </Text>
              <Text style={[styles.cloudStatusSub, { color: colors.muted, fontSize: 11 * scale }]}>
                {t.cloud_secure_sub}
              </Text>
            </View>
          </View>

          {/* Device ID Chip & Share Action */}
          <View
            style={[
              styles.deviceIdBar,
              { backgroundColor: isDark ? '#181C28' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border },
            ]}
          >
            <MaterialCommunityIcons name="identifier" size={17} color="#0284C7" />
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <Text style={[styles.deviceIdLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>
                {t.device_id_label}
              </Text>
              <Text
                selectable
                numberOfLines={1}
                ellipsizeMode="middle"
                style={[styles.deviceIdValue, { color: colors.text, fontSize: 12 * scale }]}
              >
                {deviceId || t.checking}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => void handleShareDeviceId()}
              style={[styles.sharePillBtn, { backgroundColor: isDark ? '#22283A' : '#FFFFFF' }]}
              accessibilityLabel="Share Device ID"
            >
              <MaterialCommunityIcons name="share-variant-outline" size={14} color="#0284C7" />
              <Text style={[styles.sharePillText, { color: '#0284C7', fontSize: 11 * scale }]}>{t.share}</Text>
            </Pressable>
          </View>

          {/* Action Buttons Row: Sync & Connect Another Device */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Pressable
              disabled={isManualSyncing || isSyncingBookmarks}
              onPress={() => void handleManualSync()}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#0284C7', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.cloudSyncActionBtn,
                  (isManualSyncing || isSyncingBookmarks) && { opacity: 0.7 },
                ]}
              >
                {isManualSyncing || isSyncingBookmarks ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cloud-sync-outline" size={17} color="#FFFFFF" />
                    <Text style={[styles.cloudSyncActionBtnText, { color: '#FFFFFF', fontSize: 13 * scale }]}>
                      {`${t.sync_cloud} (${bookmarkCount})`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setIsImportModalVisible(true)}
              style={[
                styles.cloudSyncActionBtn,
                {
                  backgroundColor: isDark ? '#181C28' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                  paddingHorizontal: 12,
                },
              ]}
              accessibilityLabel="Connect other device"
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={17} color="#0284C7" />
              <Text style={[styles.cloudSyncActionBtnText, { color: colors.text, fontSize: 13 * scale }]}>
                {t.connect_other_device}
              </Text>
            </Pressable>
          </View>
        </Section>
      )}
    </>
  );
}
