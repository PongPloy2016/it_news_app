import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
  StatusBar,
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

type ModalStep = 'prompt' | 'downloading';

export function ForceUpdateModal({
  visible,
  updateStatus,
  onDismiss,
}: ForceUpdateModalProps) {
  const { colors, isDark } = useNews();
  const [step, setStep] = useState<ModalStep>('prompt');

  // Google Dots Staggered Pulse Animation
  const dotScale1 = useRef(new Animated.Value(1)).current; // Cyan (Top-Left)
  const dotScale2 = useRef(new Animated.Value(1)).current; // Coral (Top-Right)
  const dotScale3 = useRef(new Animated.Value(1)).current; // Green (Bottom-Left)
  const dotScale4 = useRef(new Animated.Value(1)).current; // Yellow (Bottom-Right)

  // Download Progress Animation (0% to 100%)
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Reset step to 'prompt' whenever modal opens
  useEffect(() => {
    if (visible) {
      setStep('prompt');
      progressAnim.setValue(0);
    }
  }, [visible, progressAnim]);

  // Handle animation loop and simulated download during 'downloading' step
  useEffect(() => {
    if (step !== 'downloading' || !visible) return;

    progressAnim.setValue(0);

    // Staggered Clockwise Pulse Wave (Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left)
    const createPulse = (val: Animated.Value) =>
      Animated.sequence([
        Animated.timing(val, {
          toValue: 1.35,
          duration: 320,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
        Animated.timing(val, {
          toValue: 1.0,
          duration: 320,
          easing: Easing.bezier(0.4, 0.0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]);

    const pulseLoop = Animated.loop(
      Animated.stagger(160, [
        createPulse(dotScale1),
        createPulse(dotScale2),
        createPulse(dotScale4),
        createPulse(dotScale3),
      ]),
    );

    pulseLoop.start();

    // Progress Bar Animation (Smooth 5.5s progress mimicking Google Play download)
    const progressAnimation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5500,
      easing: Easing.bezier(0.2, 0.8, 0.2, 1),
      useNativeDriver: false,
    });

    progressAnimation.start(({ finished }) => {
      if (finished) {
        // Once downloaded, open Google Play Store to finish install
        void inAppUpdateService.openPlayStore(updateStatus?.remoteSettings?.play_store_url);
        onDismiss?.();
      }
    });

    return () => {
      pulseLoop.stop();
      progressAnimation.stop();
    };
  }, [step, visible, updateStatus, dotScale1, dotScale2, dotScale3, dotScale4, progressAnim, onDismiss]);

  if (!visible || !updateStatus || !updateStatus.isUpdateAvailable) {
    return null;
  }

  const cleanTargetVersion = updateStatus.targetVersion
    ? updateStatus.targetVersion.replace(/^v/, '')
    : '1.0.2';

  const handleConfirmUpdate = async () => {
    // 1. Immediately switch to Google Play Downloading screen!
    setStep('downloading');

    try {
      // If native Google Play in-app update is supported on this device
      if (updateStatus.source === 'google_play') {
        if (updateStatus.playUpdateInfo?.isImmediateAllowed) {
          const result = await inAppUpdateService.startImmediateUpdate();
          if (result.status === 'completed') {
            onDismiss?.();
            return;
          }
        } else if (updateStatus.playUpdateInfo?.isFlexibleAllowed) {
          await inAppUpdateService.startFlexibleUpdate();
          return;
        }
      }
    } catch (err) {
      console.warn('[ForceUpdateModal] Native update trigger error (fallback to simulated downloading screen):', err);
    }
  };

  const handleCancelDownloading = () => {
    setStep('prompt');
    onDismiss?.();
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // STEP 2: Google Play Downloading Screen
  if (step === 'downloading') {
    return (
      <Modal
        visible={visible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancelDownloading}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.downloadContainer}>
          {/* Center: 4 Google Play Pulsating Dots */}
          <View style={styles.centerContainer}>
            <View style={styles.dotsRow}>
              {/* Top-Left: Cyan */}
              <Animated.View
                style={[
                  styles.dot,
                  { backgroundColor: '#00BCD4', transform: [{ scale: dotScale1 }] },
                ]}
              />
              {/* Top-Right: Coral / Red */}
              <Animated.View
                style={[
                  styles.dot,
                  { backgroundColor: '#FF5722', transform: [{ scale: dotScale2 }] },
                ]}
              />
            </View>
            <View style={styles.dotsRow}>
              {/* Bottom-Left: Green */}
              <Animated.View
                style={[
                  styles.dot,
                  { backgroundColor: '#4CAF50', transform: [{ scale: dotScale3 }] },
                ]}
              />
              {/* Bottom-Right: Yellow */}
              <Animated.View
                style={[
                  styles.dot,
                  { backgroundColor: '#FFC107', transform: [{ scale: dotScale4 }] },
                ]}
              />
            </View>
          </View>

          {/* Lower Section: Downloading... + Progress Bar + Play Protect */}
          <View style={styles.progressSection}>
            {/* Header Row: Downloading... + Cancel Button */}
            <View style={styles.progressHeaderRow}>
              <Text style={styles.downloadingText}>Downloading...</Text>
              <TouchableOpacity
                onPress={handleCancelDownloading}
                hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                activeOpacity={0.6}
                accessibilityLabel="Cancel update"
              >
                <MaterialCommunityIcons name="close" size={22} color="#5F6368" />
              </TouchableOpacity>
            </View>

            {/* Progress Bar Track & Fill */}
            <View style={styles.progressBarTrack}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>

            {/* Verified by Play Protect Badge */}
            <View style={styles.playProtectRow}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#0F9D58" />
              <Text style={styles.playProtectText}>Verified by Play Protect</Text>
            </View>
          </View>

          {/* Bottom: Google Play Official Branding */}
          <View style={styles.footerBranding}>
            <MaterialCommunityIcons
              name="google-play"
              size={26}
              color="#0086F8"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.googlePlayText}>Google Play</Text>
          </View>
        </View>
      </Modal>
    );
  }

  // STEP 1: Human-Crafted Update Prompt Modal
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? '#161922' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              {/* Close (X) Button */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
                onPress={onDismiss}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                accessibilityLabel="ปิดหน้าต่าง"
              >
                <MaterialCommunityIcons name="close" size={18} color={colors.muted} />
              </TouchableOpacity>

              {/* Hero Icon with Soft Outer Ring */}
              <View style={styles.iconRing}>
                <LinearGradient
                  colors={isDark ? ['#1E3A8A', '#2563EB'] : ['#2563EB', '#3B82F6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.iconSquircle}
                >
                  <MaterialCommunityIcons
                    name="cellphone-arrow-down"
                    size={32}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>

              {/* Pill Badge */}
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(59, 130, 246, 0.14)'
                      : '#EFF6FF',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="creation-outline"
                  size={13}
                  color={isDark ? '#60A5FA' : '#2563EB'}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.badgeText,
                    {
                      color: isDark ? '#60A5FA' : '#2563EB',
                    },
                  ]}
                >
                  เวอร์ชันใหม่พร้อมใช้งาน
                </Text>
              </View>

              {/* Title */}
              <Text style={[styles.title, { color: colors.text }]}>
                TechThaiNews v{cleanTargetVersion}
              </Text>

              {/* Subtitle Message */}
              <Text style={[styles.message, { color: colors.muted }]}>
                อัปเดตเพื่อรับฟีเจอร์ใหม่และประสบการณ์การอ่านข่าวที่ลื่นไหลยิ่งขึ้น
              </Text>

              {/* What's New Card */}
              <View
                style={[
                  styles.changelogCard,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                  },
                ]}
              >
                <View style={styles.changelogHeader}>
                  <MaterialCommunityIcons
                    name="creation-outline"
                    size={14}
                    color={colors.primary}
                  />
                  <Text style={[styles.changelogTitle, { color: colors.text }]}>
                    มีอะไรใหม่ใน v{cleanTargetVersion}
                  </Text>
                </View>

                <View style={styles.changelogList}>
                  <View style={styles.changelogItem}>
                    <View
                      style={[
                        styles.featureBullet,
                        { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE' },
                      ]}
                    >
                      <MaterialCommunityIcons name="lightning-bolt" size={13} color="#2563EB" />
                    </View>
                    <Text style={[styles.changelogText, { color: colors.text }]}>
                      โหลดหน้าข่าวและรูปภาพได้รวดเร็วยิ่งขึ้น
                    </Text>
                  </View>

                  <View style={styles.changelogItem}>
                    <View
                      style={[
                        styles.featureBullet,
                        { backgroundColor: isDark ? 'rgba(147, 51, 234, 0.15)' : '#F3E8FF' },
                      ]}
                    >
                      <MaterialCommunityIcons name="robot-outline" size={13} color="#9333EA" />
                    </View>
                    <Text style={[styles.changelogText, { color: colors.text }]}>
                      ระบบ AI อ่านข่าวและสรุปประเด็นแม่นยำขึ้น
                    </Text>
                  </View>

                  <View style={styles.changelogItem}>
                    <View
                      style={[
                        styles.featureBullet,
                        { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5' },
                      ]}
                    >
                      <MaterialCommunityIcons name="shield-check-outline" size={13} color="#059669" />
                    </View>
                    <Text style={[styles.changelogText, { color: colors.text }]}>
                      ปรับปรุงความปลอดภัยและความเสถียรของระบบ
                    </Text>
                  </View>
                </View>

                {/* Version Transition Footer inside Card */}
                <View style={styles.versionFooter}>
                  <Text style={[styles.versionLabel, { color: colors.muted }]}>
                    เวอร์ชันของคุณ: v{CURRENT_APP_VERSION}
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={12}
                    color={colors.muted}
                    style={{ marginHorizontal: 6 }}
                  />
                  <Text style={[styles.versionTarget, { color: colors.primary }]}>
                    ล่าสุด v{cleanTargetVersion}
                  </Text>
                </View>
              </View>

              {/* Primary Action Button (Tapping this transitions to Downloading Screen) */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleConfirmUpdate}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#1D4ED8', '#2563EB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  <MaterialCommunityIcons
                    name="google-play"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.primaryButtonText}>
                    อัปเดตบน Google Play
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Secondary Action - Dismiss / Skip */}
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={onDismiss}
                activeOpacity={0.65}
                hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.muted }]}>
                  ไว้คราวหลัง
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // STEP 1: Prompt Modal Styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 26,
    borderWidth: 1,
    paddingTop: 26,
    paddingBottom: 18,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconRing: {
    padding: 6,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    marginBottom: 12,
  },
  iconSquircle: {
    width: 60,
    height: 60,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  changelogCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  changelogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  changelogTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  changelogList: {
    gap: 9,
  },
  changelogItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  featureBullet: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changelogText: {
    fontSize: 12.5,
    lineHeight: 17,
    flex: 1,
  },
  versionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  versionTarget: {
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 8,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  secondaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // STEP 2: Google Play Downloading Screen Styles
  downloadContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 28,
  },
  centerContainer: {
    position: 'absolute',
    top: '41%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  dot: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
  },
  progressSection: {
    position: 'absolute',
    top: '60%',
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadingText: {
    fontSize: 14,
    color: '#5F6368',
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  progressBarTrack: {
    width: '100%',
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#D7EFE1',
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0F9D58',
    borderRadius: 2,
  },
  playProtectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playProtectText: {
    fontSize: 12.5,
    color: '#5F6368',
    fontWeight: '400',
  },
  footerBranding: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 44 : 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googlePlayText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#5F6368',
    letterSpacing: -0.3,
  },
});
