import { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId, initializeMobileAds } from '../config/ads';
import { useNews } from '../store/NewsContext';
import { crashlyticsService } from '../services/crashlyticsService';

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
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If ads are disabled globally or banner ads are off in Supabase
  const isBannerEnabled = remoteSettings.ads_enabled && remoteSettings.banner_ads_enabled;

  useEffect(() => {
    if (isBannerEnabled) {
      void initializeMobileAds();
    }
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [isBannerEnabled]);

  if (!isBannerEnabled || hasAdError) {
    return null;
  }

  const effectiveUnitId = getBannerAdUnitId(unitId || remoteSettings.admob_banner_id_android);

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={effectiveUnitId}
        size={size}
        onAdLoaded={() => {
          setIsAdLoaded(true);
          setHasAdError(false);
        }}
        onAdFailedToLoad={(error) => {
          console.warn(`[AdMob Banner] Failed to load unit "${effectiveUnitId}":`, error?.message || error);
          crashlyticsService.log(`[AdMob Banner] Failed to load unit: ${effectiveUnitId}, error: ${error?.message || error}`);
          setHasAdError(true);

          // Retry loading after 30 seconds if it failed due to temporary inventory / network
          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            setHasAdError(false);
          }, 30000);
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
