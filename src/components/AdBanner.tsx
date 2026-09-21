import { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { BANNER_AD_UNIT_ID, initializeMobileAds } from '../config/ads';

interface AdBannerProps {
  unitId?: string;
  size?: BannerAdSize;
  style?: StyleProp<ViewStyle>;
}

export function AdBanner({
  unitId = BANNER_AD_UNIT_ID,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  style,
}: AdBannerProps) {
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [hasAdError, setHasAdError] = useState(false);

  useEffect(() => {
    void initializeMobileAds();
  }, []);

  if (hasAdError) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
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
