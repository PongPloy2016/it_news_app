import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useNews } from '../store/NewsContext';
import { CardLayoutOption } from '../types';

interface Props {
  layout?: CardLayoutOption;
}

export function SkeletonCard({ layout = 'magazine' }: Props) {
  const { colors, isDark } = useNews();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const skeletonColor = isDark ? '#263048' : '#E2E8F0';

  if (layout === 'compact') {
    return (
      <View
        style={[
          styles.compactCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.compactLeft}>
          <Animated.View
            style={[
              styles.compactBadgeSkeleton,
              { backgroundColor: skeletonColor, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.lineLong,
              { backgroundColor: skeletonColor, opacity: pulseAnim, width: '95%' },
            ]}
          />
          <Animated.View
            style={[
              styles.lineMedium,
              { backgroundColor: skeletonColor, opacity: pulseAnim, width: '70%', marginTop: 6 },
            ]}
          />

          <View style={styles.compactMetaRow}>
            <Animated.View
              style={[
                styles.lineShort,
                { backgroundColor: skeletonColor, opacity: pulseAnim, width: '40%' },
              ]}
            />
            <Animated.View
              style={[
                styles.iconSkeleton,
                { backgroundColor: skeletonColor, opacity: pulseAnim },
              ]}
            />
          </View>
        </View>

        <Animated.View
          style={[
            styles.compactImageSkeleton,
            { backgroundColor: skeletonColor, opacity: pulseAnim },
          ]}
        />
      </View>
    );
  }

  // Magazine View Skeleton (รูปที่ 2)
  return (
    <View
      style={[
        styles.magazineCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.magazineImageSkeleton,
          { backgroundColor: skeletonColor, opacity: pulseAnim },
        ]}
      />
      <View style={styles.magazineBody}>
        <Animated.View
          style={[
            styles.lineLong,
            { backgroundColor: skeletonColor, opacity: pulseAnim, width: '92%' },
          ]}
        />
        <Animated.View
          style={[
            styles.lineMedium,
            { backgroundColor: skeletonColor, opacity: pulseAnim, width: '65%', marginTop: 8 },
          ]}
        />
        <Animated.View
          style={[
            styles.lineMedium,
            { backgroundColor: skeletonColor, opacity: pulseAnim, width: '85%', marginTop: 12 },
          ]}
        />

        <View style={styles.magazineMetaRow}>
          <Animated.View
            style={[
              styles.lineShort,
              { backgroundColor: skeletonColor, opacity: pulseAnim, width: '35%' },
            ]}
          />
          <Animated.View
            style={[
              styles.iconSkeleton,
              { backgroundColor: skeletonColor, opacity: pulseAnim },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export function SkeletonFeed({ layout = 'magazine', count = 4 }: { layout?: CardLayoutOption; count?: number }) {
  return (
    <View style={styles.feedContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} layout={layout} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  feedContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  lineLong: {
    borderRadius: 6,
    height: 16,
  },
  lineMedium: {
    borderRadius: 6,
    height: 14,
  },
  lineShort: {
    borderRadius: 6,
    height: 12,
  },
  iconSkeleton: {
    borderRadius: 999,
    height: 24,
    width: 24,
  },

  // Magazine Skeleton
  magazineCard: {
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  magazineImageSkeleton: {
    height: 180,
    width: '100%',
  },
  magazineBody: {
    padding: 16,
  },
  magazineMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  // Compact Skeleton
  compactCard: {
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 10,
    padding: 12,
  },
  compactLeft: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 10,
  },
  compactBadgeSkeleton: {
    borderRadius: 4,
    height: 14,
    marginBottom: 8,
    width: 45,
  },
  compactMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  compactImageSkeleton: {
    borderRadius: 12,
    height: 76,
    width: 106,
  },
});
