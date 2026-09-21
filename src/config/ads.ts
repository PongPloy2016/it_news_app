import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

export const ADMOB_APP_ID = 'ca-app-pub-7617756372558825~3760194254';
export const PRODUCTION_BANNER_AD_UNIT_ID = 'ca-app-pub-7617756372558825/6620045902';
export const PRODUCTION_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-7617756372558825/7821446931';

// In development mode, use Google's official Test ID to protect your AdMob account from policy violations.
// In production builds, the real ad unit ID is used automatically.
export const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : PRODUCTION_BANNER_AD_UNIT_ID;

export const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : PRODUCTION_INTERSTITIAL_AD_UNIT_ID;

let isAdsInitialized = false;

/**
 * Initializes the Google Mobile Ads SDK. Safe to call multiple times.
 */
export async function initializeMobileAds(): Promise<void> {
  if (isAdsInitialized) return;
  try {
    const adapterStatuses = await mobileAds().initialize();
    isAdsInitialized = true;
    if (__DEV__) {
      console.log('[AdMob] Initialized successfully:', adapterStatuses);
    }
  } catch (error) {
    console.warn('[AdMob] Initialization failed:', error);
  }
}
