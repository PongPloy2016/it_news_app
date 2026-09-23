import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT_ID, initializeMobileAds } from '../config/ads';
import { useNews } from '../store/NewsContext';

interface AdCardProps {
  unitId?: string;
  size?: BannerAdSize;
  style?: StyleProp<ViewStyle>;
  title?: string;
}

export function AdCard({
  unitId = BANNER_AD_UNIT_ID,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
  title = 'ผู้สนับสนุน / สปอนเซอร์',
}: AdCardProps) {
  const { colors, scale } = useNews();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasAdError, setHasAdError] = useState(false);

  useEffect(() => {
    void initializeMobileAds();
  }, []);

  if (hasAdError) {
    return null;
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {/* Top Header Badge */}
      <View style={styles.headerRow}>
        <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="bullhorn-outline" size={12 * scale} color={colors.muted} />
          <Text style={[styles.badgeText, { color: colors.muted, fontSize: 11 * scale }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.sponsoredLabel, { color: colors.muted, fontSize: 10 * scale }]}>
          โฆษณา
        </Text>
      </View>

      {/* Ad Content */}
      <View style={styles.adWrap}>
        <BannerAd
          unitId={unitId}
          size={size}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdLoaded={() => {
            setIsAdLoaded(true);
            setHasAdError(false);
          }}
          onAdFailedToLoad={(error) => {
            if (__DEV__) {
              console.warn('[AdMob AdCard] Failed to load:', error);
            }
            setHasAdError(true);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginVertical: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sponsoredLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  adWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 50,
  },
});
