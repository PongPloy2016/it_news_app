import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT_ID, initializeMobileAds } from '../config/ads';
import { useNews } from '../store/NewsContext';

interface AdBannerProps {
  unitId?: string;
  size?: BannerAdSize;
  style?: StyleProp<ViewStyle>;
}

export function AdBanner({
  unitId,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
}: AdBannerProps) {
  const { remoteSettings } = useNews();
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasAdError, setHasAdError] = useState(false);

  // If ads are disabled globally or banner ads are off in Supabase
  const isBannerEnabled = remoteSettings.ads_enabled && remoteSettings.banner_ads_enabled;

  useEffect(() => {
    if (isBannerEnabled) {
      void initializeMobileAds();
    }
  }, [isBannerEnabled]);

  if (!isBannerEnabled || hasAdError) {
    return null;
  }

  const effectiveUnitId = unitId || remoteSettings.admob_banner_id_android || BANNER_AD_UNIT_ID;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={effectiveUnitId}
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
            console.warn('[AdMob Banner] Failed to load:', error);
          }
          setHasAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    overflow: 'hidden',
  },
});
