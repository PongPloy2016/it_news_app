import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
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

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_GAP = 10;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - GRID_GAP) / 2;

/**
 * Editorial Homepage Skeleton that precisely mirrors:
 * 1. Flash Dispatch Ticker (ข่าวด่วนหมุนเวียน)
 * 2. Hero Showcase Slider + Trending Highlights ("ประเด็นร้อนน่าสนใจ")
 * 3. Category Section Block (Header + 2x2 Grid)
 */
export function HomeEditorialSkeleton() {
  const { colors, isDark, scale } = useNews();
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

  const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0';
  const skeletonSubtle = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9';

  return (
    <View style={styles.editorialContainer}>
      {/* 1. Flash Dispatch Ticker Skeleton */}
      <View
        style={[
          styles.flashTickerSkeleton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.flashPillBadge}>
          <MaterialCommunityIcons name="flash" size={12 * scale} color="#FFFFFF" style={{ marginRight: 2 }} />
          <Text style={[styles.flashPillText, { fontSize: 10 * scale }]}>FLASH</Text>
        </View>

        <View style={styles.flashContentSkeleton}>
          <Animated.View
            style={[
              styles.flashSourceTag,
              { backgroundColor: skeletonColor, opacity: pulseAnim },
            ]}
          />
          <Animated.View
            style={[
              styles.flashHeadline,
              { backgroundColor: skeletonColor, opacity: pulseAnim },
            ]}
          />
        </View>

        <View style={styles.flashControls}>
          <MaterialCommunityIcons name="chevron-left" size={16 * scale} color={colors.muted} />
          <MaterialCommunityIcons name="chevron-right" size={16 * scale} color={colors.muted} />
        </View>
      </View>

      {/* 2. Hero Showcase Slider Skeleton */}
      <View style={styles.heroWrapper}>
        <View
          style={[
            styles.heroCardSkeleton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Subtle background placeholder */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: skeletonSubtle, opacity: pulseAnim },
            ]}
          />

          {/* Floating content overlay at bottom */}
          <View style={styles.heroContentWrap}>
            {/* Kicker Pill */}
            <Animated.View
              style={[
                styles.heroKickerPill,
                { backgroundColor: '#EF4444', opacity: 0.8 },
              ]}
            >
              <View style={{ width: 110, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' }} />
            </Animated.View>

            {/* Title Line 1 & Line 2 */}
            <Animated.View
              style={[
                styles.heroTitleLine1,
                { backgroundColor: skeletonColor, opacity: pulseAnim },
              ]}
            />
            <Animated.View
              style={[
                styles.heroTitleLine2,
                { backgroundColor: skeletonColor, opacity: pulseAnim },
              ]}
            />

            {/* Meta Row: Clock + Time + Dot + Reading Time */}
            <View style={styles.heroMetaRow}>
              <MaterialCommunityIcons name="clock-outline" size={13 * scale} color={colors.muted} />
              <Animated.View
                style={[
                  styles.heroMetaLine,
                  { backgroundColor: skeletonColor, opacity: pulseAnim, width: 55, marginLeft: 5, marginRight: 8 },
                ]}
              />
              <Text style={{ color: colors.muted, marginHorizontal: 2 }}>•</Text>
              <Animated.View
                style={[
                  styles.heroMetaLine,
                  { backgroundColor: skeletonColor, opacity: pulseAnim, width: 50, marginLeft: 6 },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Dash Indicators Row (5 dashes: 1 active, 4 inactive) */}
        <View style={styles.heroDashesRow}>
          <View style={[styles.heroDash, styles.heroDashActive]} />
          <View style={[styles.heroDash, styles.heroDashInactive, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
          <View style={[styles.heroDash, styles.heroDashInactive, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
          <View style={[styles.heroDash, styles.heroDashInactive, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
          <View style={[styles.heroDash, styles.heroDashInactive, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
        </View>
      </View>

      {/* 3. Trending Highlights Section ("ประเด็นร้อนน่าสนใจ") Skeleton */}
      <View style={styles.highlightsWrap}>
        <View style={styles.highlightsHeader}>
          <MaterialCommunityIcons name="trending-up" size={16 * scale} color="#0EA5E9" style={{ marginRight: 6 }} />
          <Text style={[styles.highlightsHeading, { color: colors.text, fontSize: 13.5 * scale }]}>
            ประเด็นร้อนน่าสนใจ
          </Text>
        </View>

        {/* 4 Highlight Cards (Matches loaded UI 4 articles 1:1) */}
        {[0, 1, 2, 3].map((idx) => (
          <View
            key={`hl-skel-${idx}`}
            style={[
              styles.highlightCardSkeleton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Left square thumbnail */}
            <Animated.View
              style={[
                styles.highlightThumbSkeleton,
                { backgroundColor: skeletonColor, opacity: pulseAnim },
              ]}
            />

            {/* Right text body */}
            <View style={styles.highlightBodySkeleton}>
              <Animated.View
                style={[
                  styles.highlightTagSkeleton,
                  { backgroundColor: '#0EA5E9', opacity: 0.4 },
                ]}
              />
              <Animated.View
                style={[
                  styles.highlightTitle1,
                  { backgroundColor: skeletonColor, opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.highlightTitle2,
                  { backgroundColor: skeletonColor, opacity: pulseAnim },
                ]}
              />
              <Animated.View
                style={[
                  styles.highlightTimeSkeleton,
                  { backgroundColor: skeletonColor, opacity: pulseAnim },
                ]}
              />
            </View>
          </View>
        ))}
      </View>

      {/* 4. Category Section Block Skeleton (Header + 2x2 Cards Grid) */}
      <View style={styles.catSectionWrap}>
        <View style={[styles.catHeaderBar, { borderLeftColor: '#2F6FED' }]}>
          <View style={styles.catHeaderLeft}>
            <View style={[styles.catBadge, { backgroundColor: '#2F6FED' }]}>
              <MaterialCommunityIcons name="laptop" size={11 * scale} color="#FFFFFF" style={{ marginRight: 3 }} />
              <Text style={[styles.catBadgeText, { fontSize: 9.5 * scale }]}>TECH & BUSINESS</Text>
            </View>
            <Text numberOfLines={1} style={[styles.catTitleText, { color: colors.text, fontSize: 14 * scale }]}>
              เทคโนโลยีและธุรกิจดิจิทัล
            </Text>
          </View>
          <View style={styles.catViewAllWrap}>
            <Text style={[styles.catViewAllText, { color: '#2F6FED', fontSize: 11.5 * scale }]}>
              ดูทั้งหมด
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={15 * scale} color="#2F6FED" />
          </View>
        </View>

        {/* 2x2 Grid of Cards */}
        <View style={styles.catGrid}>
          {[0, 1].map((rowIdx) => (
            <View key={`grid-row-${rowIdx}`} style={styles.catGridRow}>
              {[0, 1].map((colIdx) => (
                <View
                  key={`grid-card-${rowIdx}-${colIdx}`}
                  style={[
                    styles.catCard,
                    {
                      width: CARD_WIDTH,
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.catCardImg,
                      { backgroundColor: skeletonColor, opacity: pulseAnim },
                    ]}
                  />
                  <View style={styles.catCardBody}>
                    <Animated.View
                      style={[
                        styles.catCardLine1,
                        { backgroundColor: skeletonColor, opacity: pulseAnim },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.catCardLine2,
                        { backgroundColor: skeletonColor, opacity: pulseAnim },
                      ]}
                    />
                    <View style={styles.catCardMetaRow}>
                      <Animated.View
                        style={[
                          styles.catCardTime,
                          { backgroundColor: skeletonColor, opacity: pulseAnim },
                        ]}
                      />
                      <MaterialCommunityIcons name="bookmark-outline" size={15} color={colors.muted} />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

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

  // HomeEditorialSkeleton Styles
  editorialContainer: {
    width: '100%',
  },
  flashTickerSkeleton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  flashPillBadge: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 6,
    flexDirection: 'row',
    marginRight: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  flashPillText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  flashContentSkeleton: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  flashSourceTag: {
    borderRadius: 4,
    height: 16,
    marginRight: 8,
    width: 70,
  },
  flashHeadline: {
    borderRadius: 4,
    flex: 1,
    height: 14,
  },
  flashControls: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    marginLeft: 6,
  },

  heroWrapper: {
    marginBottom: 16,
    width: '100%',
  },
  heroCardSkeleton: {
    borderRadius: 16,
    borderWidth: 1,
    height: 220,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 14,
    width: '100%',
  },
  heroContentWrap: {
    width: '100%',
  },
  heroKickerPill: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    marginBottom: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  heroTitleLine1: {
    borderRadius: 4,
    height: 16,
    marginBottom: 6,
    width: '92%',
  },
  heroTitleLine2: {
    borderRadius: 4,
    height: 16,
    marginBottom: 10,
    width: '68%',
  },
  heroMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroMetaLine: {
    borderRadius: 3,
    height: 11,
  },
  heroDashesRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  heroDash: {
    borderRadius: 2,
    height: 4,
  },
  heroDashActive: {
    backgroundColor: '#0EA5E9',
    marginRight: 4,
    width: 22,
  },
  heroDashInactive: {
    marginHorizontal: 3,
    width: 8,
  },

  highlightsWrap: {
    marginBottom: 18,
  },
  highlightsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 10,
  },
  highlightsHeading: {
    fontWeight: '700',
  },
  highlightCardSkeleton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 8,
  },
  highlightThumbSkeleton: {
    borderRadius: 8,
    height: 66,
    width: 66,
  },
  highlightBodySkeleton: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  highlightTagSkeleton: {
    borderRadius: 3,
    height: 12,
    marginBottom: 6,
    width: 80,
  },
  highlightTitle1: {
    borderRadius: 3,
    height: 13,
    marginBottom: 4,
    width: '96%',
  },
  highlightTitle2: {
    borderRadius: 3,
    height: 13,
    marginBottom: 6,
    width: '75%',
  },
  highlightTimeSkeleton: {
    borderRadius: 3,
    height: 10,
    width: 55,
  },

  catSectionWrap: {
    marginBottom: 16,
  },
  catHeaderBar: {
    alignItems: 'center',
    borderLeftWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingLeft: 8,
  },
  catHeaderLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  catBadge: {
    alignItems: 'center',
    borderRadius: 4,
    flexDirection: 'row',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  catBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  catTitleText: {
    fontWeight: '700',
  },
  catViewAllWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  catViewAllText: {
    fontWeight: '600',
    marginRight: 2,
  },
  catGrid: {
    gap: 10,
  },
  catGridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  catCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  catCardImg: {
    height: 105,
    width: '100%',
  },
  catCardBody: {
    padding: 8,
  },
  catCardLine1: {
    borderRadius: 3,
    height: 12,
    marginBottom: 4,
    width: '95%',
  },
  catCardLine2: {
    borderRadius: 3,
    height: 12,
    marginBottom: 8,
    width: '65%',
  },
  catCardMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  catCardTime: {
    borderRadius: 3,
    height: 10,
    width: 45,
  },
});
