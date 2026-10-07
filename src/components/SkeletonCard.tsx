import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
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

export function SkeletonGridCard() {
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

  return (
    <View
      style={[
        styles.gridCardSkeleton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.gridImageSkeleton,
          { backgroundColor: skeletonColor, opacity: pulseAnim },
        ]}
      />
      <View style={styles.gridBodySkeleton}>
        <Animated.View
          style={[
            styles.lineLong,
            { backgroundColor: skeletonColor, opacity: pulseAnim, width: '90%', height: 13 },
          ]}
        />
        <Animated.View
          style={[
            styles.lineMedium,
            { backgroundColor: skeletonColor, opacity: pulseAnim, width: '65%', height: 13, marginTop: 6 },
          ]}
        />
        <View style={styles.gridMetaRowSkeleton}>
          <Animated.View
            style={[
              styles.lineShort,
              { backgroundColor: skeletonColor, opacity: pulseAnim, width: '50%', height: 10 },
            ]}
          />
          <Animated.View
            style={[
              styles.iconSkeletonSmall,
              { backgroundColor: skeletonColor, opacity: pulseAnim },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export function SkeletonGridFeed({ count = 4 }: { count?: number }) {
  const safeCount = count % 2 === 0 ? count : count + 1;
  const pairs: number[][] = [];
  for (let i = 0; i < safeCount; i += 2) {
    pairs.push([i, i + 1]);
  }

  return (
    <View style={styles.gridFeedContainer}>
      {pairs.map((_, rowIndex) => (
        <View key={rowIndex} style={styles.gridRowWrap}>
          <SkeletonGridCard />
          <SkeletonGridCard />
        </View>
      ))}
    </View>
  );
}

export function SkeletonFeed({ layout = 'magazine', count = 4 }: { layout?: CardLayoutOption; count?: number }) {
  if (layout === 'compact') {
    return <CustomListSkeleton count={count} />;
  }
  if (layout === 'grid') {
    return <SkeletonGridFeed count={count} />;
  }
  return (
    <View style={styles.feedContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} layout={layout} />
      ))}
    </View>
  );
}

/**
 * Custom Refresh / Bookmark Loading Skeleton matching the custom_refresh_indicator design:
 * Left: Rounded square thumbnail
 * Right: 3 horizontal placeholder lines
 */
export function BookmarkListSkeleton({
  count = 5,
  style,
}: {
  count?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isDark } = useNews();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0';

  return (
    <View style={[styles.customSkeletonFeed, style]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.customSkeletonRow,
            {
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}
        >
          {/* Rounded square thumbnail on left */}
          <Animated.View
            style={[
              styles.customThumbSkeleton,
              { backgroundColor: skeletonColor, opacity: pulseAnim },
            ]}
          />

          {/* 3 horizontal placeholder lines on right */}
          <View style={styles.customLinesWrap}>
            <Animated.View
              style={[
                styles.customLine,
                { backgroundColor: skeletonColor, opacity: pulseAnim, width: '96%' },
              ]}
            />
            <Animated.View
              style={[
                styles.customLine,
                { backgroundColor: skeletonColor, opacity: pulseAnim, width: '82%' },
              ]}
            />
            <Animated.View
              style={[
                styles.customLineSmall,
                { backgroundColor: skeletonColor, opacity: pulseAnim, width: '54%' },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export const CustomListSkeleton = BookmarkListSkeleton;

const styles = StyleSheet.create({
  customSkeletonFeed: {
    paddingHorizontal: 16,
    paddingTop: 4,
    width: '100%',
  },
  customSkeletonRow: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 14,
  },
  customThumbSkeleton: {
    borderRadius: 12,
    height: 68,
    width: 68,
  },
  customLinesWrap: {
    flex: 1,
    gap: 9,
    justifyContent: 'center',
    marginLeft: 14,
  },
  customLine: {
    borderRadius: 5,
    height: 14,
  },
  customLineSmall: {
    borderRadius: 4,
    height: 12,
  },
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

  // Grid Skeleton Styles
  gridFeedContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridRowWrap: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  gridCardSkeleton: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    overflow: 'hidden',
  },
  gridImageSkeleton: {
    height: 105,
    width: '100%',
  },
  gridBodySkeleton: {
    padding: 10,
  },
  gridMetaRowSkeleton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  iconSkeletonSmall: {
    borderRadius: 999,
    height: 18,
    width: 18,
  },
});
