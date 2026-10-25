import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNews } from '../store/NewsContext';
import { oneSignalService } from '../services/oneSignalService';
import { notificationService } from '../services/notificationService';

export const WELCOME_NOTIF_STORAGE_KEY = '@techthainews_has_seen_welcome_notif_v1';

interface WelcomeNotificationModalProps {
  forceVisible?: boolean;
  onDismiss?: () => void;
}

export function WelcomeNotificationModal({
  forceVisible,
  onDismiss,
}: WelcomeNotificationModalProps) {
  const { isDark } = useNews();
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (forceVisible !== undefined) {
      if (forceVisible) {
        openModal();
      } else {
        closeModal();
      }
      return;
    }

    let isMounted = true;
    const checkFirstTimeLaunch = async () => {
      try {
        const hasSeen = await AsyncStorage.getItem(WELCOME_NOTIF_STORAGE_KEY);
        if (hasSeen === 'true') return;

        const isGranted = await oneSignalService.getPermissionAsync();
        if (isGranted) {
          await AsyncStorage.setItem(WELCOME_NOTIF_STORAGE_KEY, 'true');
          return;
        }

        // Wait a short moment so the user sees the main feed first
        setTimeout(() => {
          if (isMounted) {
            openModal();
          }
        }, 1200);
      } catch (err) {
        console.warn('[WelcomeNotificationModal] Check error:', err);
      }
    };

    void checkFirstTimeLaunch();

    return () => {
      isMounted = false;
    };
  }, [forceVisible]);

  const openModal = () => {
    setIsVisible(true);
    backdropAnim.setValue(0);
    cardScale.setValue(0.92);
    cardTranslateY.setValue(20);

    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardScale, {
        toValue: 1,
        damping: 20,
        mass: 0.85,
        stiffness: 240,
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 0.94,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 16,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss?.();
      callback?.();
    });
  };

  const handleEnableNotifications = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await AsyncStorage.setItem(WELCOME_NOTIF_STORAGE_KEY, 'true');
      await oneSignalService.requestPermission(true);
      if (Platform.OS === 'android') {
        await notificationService.requestPermission();
      }
    } catch (err) {
      console.warn('[WelcomeNotificationModal] Request permission error:', err);
    } finally {
      setIsSubmitting(false);
      closeModal();
    }
  };

  const handleDismiss = async () => {
    try {
      await AsyncStorage.setItem(WELCOME_NOTIF_STORAGE_KEY, 'true');
    } catch (err) {
      console.warn('[WelcomeNotificationModal] Dismiss error:', err);
    }
    closeModal();
  };

  if (!isVisible) return null;

  const cardBg = isDark ? '#0B132B' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(0, 0, 0, 0.08)';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const textMuted = isDark ? '#94A3B8' : '#64748B';
  const previewBoxBg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC';
  const previewBoxBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0';

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalRoot}>
        {/* Backdrop (touch outside to dismiss) */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
              backgroundColor: isDark ? 'rgba(3, 7, 18, 0.82)' : 'rgba(15, 23, 42, 0.65)',
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} accessibilityLabel="ปิดหน้าต่าง" />
        </Animated.View>

        {/* Floating Card Dialog */}
        <Animated.View
          style={[
            styles.dialogCard,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              transform: [{ scale: cardScale }, { translateY: cardTranslateY }],
            },
          ]}
        >
          {/* Hero Visual Banner (3D Glass Notification Illustration) */}
          <View style={styles.heroBannerWrap}>
            <Image
              source={require('../../assets/notification-hero.jpg')}
              style={styles.heroBannerImage}
              resizeMode="cover"
            />

            {/* Seamless Bottom Gradient Blend into Card */}
            <LinearGradient
              colors={
                isDark
                  ? ['transparent', 'rgba(11, 19, 43, 0.6)', '#0B132B']
                  : ['transparent', 'rgba(255, 255, 255, 0.6)', '#FFFFFF']
              }
              style={styles.heroGradientOverlay}
            />

            {/* Frosted Close Button (X) */}
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}
              hitSlop={{ top: 16, right: 16, bottom: 16, left: 16 }}
              accessibilityLabel="ปิดหน้าต่าง"
            >
              <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
            </Pressable>

            {/* Live Indicator Pill on Banner */}
            <View style={styles.badgePill}>
              <View style={styles.badgePillDot} />
              <Text style={styles.badgePillText}>TechThaiNews Alert</Text>
            </View>
          </View>

          {/* Body Content */}
          <View style={styles.bodyWrap}>
            <Text style={[styles.title, { color: textColor }]}>
              ไม่พลาดทุกข่าวด่วนไอที
            </Text>

            <Text style={[styles.subtitle, { color: textMuted }]}>
              เกาะติดความเคลื่อนไหววงการเทคโนโลยี สรุป AI สำคัญ และประเด็นร้อนประจำวัน ส่งตรงถึงคุณก่อนใคร
            </Text>

            {/* Trust / Frequency Guarantee Banner */}
            <View
              style={[
                styles.guaranteeCard,
                { backgroundColor: previewBoxBg, borderColor: previewBoxBorder },
              ]}
            >
              <View style={styles.guaranteeIconWrap}>
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#38BDF8" />
              </View>
              <View style={styles.guaranteeTextWrap}>
                <Text style={[styles.guaranteeTitle, { color: textColor }]}>
                  ส่งเฉพาะข่าวสำคัญ ไม่รบกวน
                </Text>
                <Text style={[styles.guaranteeDesc, { color: textMuted }]}>
                  คัดกรองเฉพาะข่าวเทคเด่นรายวัน ปรับแต่งหรือปิดได้ตลอดเวลา
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <Pressable
              onPress={handleEnableNotifications}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.primaryBtnTouchable, pressed && { opacity: 0.88 }]}
            >
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                <MaterialCommunityIcons
                  name="bell"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryBtnText}>
                  {isSubmitting ? 'กำลังตั้งค่า...' : 'เปิดการแจ้งเตือน'}
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Text style={[styles.secondaryBtnText, { color: textMuted }]}>
                ไว้ภายหลัง
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 375,
    borderRadius: 28,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 24,
  },
  heroBannerWrap: {
    width: '100%',
    height: 195,
    backgroundColor: '#050B18',
    position: 'relative',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 65,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 12,
  },
  badgePill: {
    position: 'absolute',
    bottom: 12,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.30)',
  },
  badgePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
    marginRight: 6,
  },
  badgePillText: {
    color: '#E0F2FE',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bodyWrap: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
  },
  guaranteeCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
  },
  guaranteeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  guaranteeTextWrap: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    marginBottom: 1,
  },
  guaranteeDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  primaryBtnTouchable: {
    width: '100%',
    borderRadius: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryBtn: {
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '500',
  },
});
