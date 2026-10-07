import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useNews } from '../store/NewsContext';
import { CustomListSkeleton } from './SkeletonCard';

interface CustomRefreshHeaderProps {
  visible: boolean;
  label?: string;
  color?: string;
}

/**
 * Animated Custom Refresh Header matching Flutter's custom_refresh_indicator:
 * Features a spinning sync icon, glassmorphic capsule, and animated pulse indicator.
 */
export function CustomRefreshHeader({
  visible,
  label = 'กำลังอัปเดตข้อมูลล่าสุด...',
  color,
}: CustomRefreshHeaderProps) {
  const { colors, isDark, scale } = useNews();
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in and slide down
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Continuous smooth 360 degree spin loop
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      spinAnimation.start();

      return () => {
        spinAnimation.stop();
      };
    } else {
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      spinValue.setValue(0);
    }
  }, [visible, fadeValue, spinValue]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const translateY = fadeValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const accentColor = color ?? colors.primary;

  return (
    <Animated.View
      style={[
        styles.headerContainer,
        {
          opacity: fadeValue,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.92)' : '#F1F5F9',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <MaterialCommunityIcons name="sync" size={17} color={accentColor} />
        </Animated.View>
        <Text
          style={[
            styles.label,
            {
              color: colors.text,
              fontSize: 12.5 * scale,
            },
          ]}
        >
          {label}
        </Text>
      </View>
    </Animated.View>
  );
}

interface CustomRefreshIndicatorProps {
  refreshing: boolean;
  isLoading?: boolean;
  label?: string;
  color?: string;
  skeletonCount?: number;
  children?: React.ReactNode;
}

/**
 * Custom Refresh Indicator Widget inspired by Flutter custom_refresh_indicator package:
 * - Shows waiting skeleton loading on screen entry and feed switching
 * - Shows custom animated header bar during refresh
 */
export function CustomRefreshIndicator({
  refreshing,
  isLoading = false,
  label,
  color,
  skeletonCount = 6,
  children,
}: CustomRefreshIndicatorProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingWrapper}>
        <CustomRefreshHeader visible={true} label={label} color={color} />
        <CustomListSkeleton count={skeletonCount} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {refreshing && <CustomRefreshHeader visible={true} label={label} color={color} />}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    paddingTop: 6,
  },
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
    width: '100%',
  },
  pill: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  label: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
