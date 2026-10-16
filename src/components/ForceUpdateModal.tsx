import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNews } from '../store/NewsContext';
import {
  CheckUpdateStatus,
  inAppUpdateService,
  CURRENT_APP_VERSION,
} from '../services/inAppUpdateService';

interface ForceUpdateModalProps {
  visible: boolean;
  updateStatus: CheckUpdateStatus | null;
  onDismiss?: () => void;
}

export function ForceUpdateModal({
  visible,
  updateStatus,
  onDismiss,
}: ForceUpdateModalProps) {
  const { colors, isDark } = useNews();
  const [isUpdating, setIsUpdating] = useState(false);

  if (!visible || !updateStatus || !updateStatus.isUpdateAvailable) {
    return null;
  }

  const isForce = updateStatus.isForceUpdate;
  const isGooglePlayImmediate =
    updateStatus.source === 'google_play' &&
    Boolean(updateStatus.playUpdateInfo?.isImmediateAllowed);

  const handleUpdate = async () => {
    try {
      setIsUpdating(true);

      // If Google Play native In-App Update is available, trigger immediate update flow
      if (isGooglePlayImmediate) {
        const result = await inAppUpdateService.startImmediateUpdate();
        setIsUpdating(false);

        if (result.status === 'cancelled') {
          if (isForce) {
            Alert.alert(
              'ต้องทำการอัปเดต',
              'แอปพลิเคชันเวอร์ชันนี้หยุดให้บริการแล้ว กรุณาอัปเดตเพื่อเข้าใช้งานต่อ',
              [
                { text: 'ออกจากแอป', style: 'destructive', onPress: () => inAppUpdateService.exitApp() },
                { text: 'ลองใหม่อีกครั้ง', onPress: () => void handleUpdate() },
              ],
              { cancelable: false },
            );
          }
        }
        return;
      }

      // Otherwise, open Google Play Store directly
      await inAppUpdateService.openPlayStore(updateStatus.remoteSettings?.play_store_url);
      setIsUpdating(false);
    } catch (err: any) {
      setIsUpdating(false);
      console.warn('[ForceUpdateModal] Update error:', err);
      // Fallback to opening Google Play Store directly in case native flow errored
      await inAppUpdateService.openPlayStore(updateStatus.remoteSettings?.play_store_url);
    }
  };

  const handleExitOrDismiss = () => {
    if (isForce) {
      Alert.alert(
        'ออกจากแอปพลิเคชัน',
        'ต้องการออกจากแอปพลิเคชันหรือไม่?',
        [
          { text: 'ยกเลิก', style: 'cancel' },
          {
            text: 'ออก',
            style: 'destructive',
            onPress: () => {
              inAppUpdateService.exitApp();
              if (Platform.OS === 'android') {
                BackHandler.exitApp();
              }
            },
          },
        ],
      );
    } else {
      onDismiss?.();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (isForce) {
          handleExitOrDismiss();
        } else {
          onDismiss?.();
        }
      }}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#131F3A' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header Icon Container */}
          <LinearGradient
            colors={isForce ? ['#FF4D4D', '#F97316'] : [colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <MaterialCommunityIcons
              name={isForce ? 'shield-alert' : 'rocket-launch'}
              size={38}
              color="#FFFFFF"
            />
          </LinearGradient>

          {/* Badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isForce
                  ? 'rgba(239, 68, 68, 0.15)'
                  : isDark
                  ? 'rgba(56, 189, 248, 0.15)'
                  : 'rgba(2, 132, 199, 0.12)',
              },
            ]}
          >
            <MaterialCommunityIcons
              name={isForce ? 'alert-decagram' : 'creation'}
              size={14}
              color={isForce ? '#EF4444' : colors.primary}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isForce ? '#EF4444' : colors.primary },
              ]}
            >
              {isForce ? 'จำเป็นต้องอัปเดต' : 'เวอร์ชันใหม่พร้อมใช้งาน'}
            </Text>
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.text }]}>
            {updateStatus.title || 'อัปเดต TechThaiNews'}
          </Text>

          <Text style={[styles.message, { color: colors.muted }]}>
            {updateStatus.message}
          </Text>

          {/* Version Comparison Box */}
          <View
            style={[
              styles.versionBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: colors.muted }]}>
                เวอร์ชันปัจจุบัน
              </Text>
              <Text style={[styles.versionValue, { color: colors.text }]}>
                v{CURRENT_APP_VERSION}
              </Text>
            </View>

            <MaterialCommunityIcons
              name="arrow-right-thin"
              size={24}
              color={colors.primary}
            />

            <View style={styles.versionCol}>
              <Text style={[styles.versionLabel, { color: colors.muted }]}>
                เวอร์ชันล่าสุด
              </Text>
              <Text style={[styles.versionValue, { color: colors.primary, fontWeight: '700' }]}>
                {updateStatus.targetVersion?.startsWith('v')
                  ? updateStatus.targetVersion
                  : `v${updateStatus.targetVersion || '1.0.1'}`}
              </Text>
            </View>
          </View>

          {/* Features bullet list */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.text }]}>
                เพิ่มประสิทธิภาพและความเร็วในการโหลดข่าว
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.text }]}>
                ระบบอ่านข่าว AI สรุปและฟังก์ชันใหม่ล่าสุด
              </Text>
            </View>
            <View style={styles.featureItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" />
              <Text style={[styles.featureText, { color: colors.text }]}>
                อัปเดตความปลอดภัยและการสนับสนุนระบบ
              </Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleUpdate}
            disabled={isUpdating}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isForce ? ['#EF4444', '#DC2626'] : [colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              {isUpdating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="google-play"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    {isForce ? 'อัปเดตทันทีผ่าน Google Play' : 'อัปเดตเป็นเวอร์ชันล่าสุด'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary Action */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleExitOrDismiss}
            activeOpacity={0.7}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>
              {isForce ? 'ออกจากแอปพลิเคชัน' : 'ไว้ภายหลัง'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 11, 24, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 18,
  },
  versionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  versionCol: {
    alignItems: 'center',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  versionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  featuresList: {
    width: '100%',
    marginBottom: 20,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 10,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
