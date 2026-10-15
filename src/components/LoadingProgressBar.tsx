import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useNews } from '../store/NewsContext';

// ============================================================================
// 1. TOP SLIM PROGRESS BAR (Like YouTube / Chrome / Twitter)
// ============================================================================
interface TopProgressBarProps {
  progress?: number; // 0 to 1
  visible?: boolean;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function TopProgressBar({
  progress = 0,
  visible = true,
  color = '#0EA5E9',
  height = 3,
  style,
}: TopProgressBarProps) {
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: visible ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [visible, opacityAnim]);

  useEffect(() => {
    const clamped = Math.max(0, Math.min(1, progress));
    Animated.timing(animatedProgress, {
      toValue: clamped,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedProgress]);

  if (!visible) return null;

  const widthInterpolate = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.topBarContainer, { height, opacity: opacityAnim }, style]}>
      <Animated.View style={[styles.topBarFill, { width: widthInterpolate }]}>
        <LinearGradient
          colors={['#0284C7', color, '#38BDF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

// ============================================================================
// 2. HOME LOADING PROGRESS CARD (Shows % and stage status)
// ============================================================================
interface HomeLoadingProgressCardProps {
  progress?: number; // 0 to 1
  statusText?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export function HomeLoadingProgressCard({
  progress = 0,
  statusText = 'กำลังเตรียมเนื้อหาข่าวสาร...',
  color = '#0EA5E9',
  style,
}: HomeLoadingProgressCardProps) {
  const { colors, scale } = useNews();
  const animatedWidth = useRef(new Animated.Value(Math.max(0.08, progress))).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Continuous subtle spin animation for the sync icon
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spinAnim]);

  // Smooth progress bar animation
  useEffect(() => {
    const clamped = Math.max(0.08, Math.min(1, progress));
    Animated.timing(animatedWidth, {
      toValue: clamped,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['8%', '100%'],
  });

  const displayPercent = Math.min(100, Math.round(progress * 100));

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header Row: Icon + Status Text + Percent Badge */}
      <View style={styles.cardHeader}>
        <View style={styles.statusLeft}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons name="sync" size={15 * scale} color={color} />
          </Animated.View>
          <Text
            numberOfLines={1}
            style={[styles.statusText, { color: colors.text, fontSize: 12 * scale }]}
          >
            {statusText}
          </Text>
        </View>

        <View style={[styles.percentBadge, { backgroundColor: color }]}>
          <Text style={[styles.percentText, { fontSize: 11 * scale }]}>
            {displayPercent}%
          </Text>
        </View>
      </View>

      {/* Progress Track & Animated Fill */}
      <View style={[styles.track, { backgroundColor: colors.surfaceVariant }]}>
        <Animated.View style={[styles.fillWrap, { width: widthInterpolate }]}>
          <LinearGradient
            colors={[color, '#38BDF8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBarContainer: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    zIndex: 99,
  },
  topBarFill: {
    height: '100%',
  },
  cardContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  statusText: {
    fontWeight: '600',
    flex: 1,
  },
  percentBadge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    width: '100%',
  },
  fillWrap: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  gradientFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});
