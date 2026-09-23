import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

export const ADMOB_APP_ID = 'ca-app-pub-7617756372558825~3760194254';
export const PRODUCTION_BANNER_AD_UNIT_ID = 'ca-app-pub-7617756372558825/6620045902';
export const PRODUCTION_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-7617756372558825/7821446931';

// Use TestIds for demo ads (displays Google sample ads reliably during testing)
export const BANNER_AD_UNIT_ID = TestIds.BANNER;
export const INTERSTITIAL_AD_UNIT_ID = TestIds.INTERSTITIAL;

let isAdsInitialized = false;

/**
 * Initializes the Google Mobile Ads SDK. Safe to call multiple times.
 */
export async function initializeMobileAds(): Promise<void> {
  if (isAdsInitialized) return;
  try {
    await mobileAds().setRequestConfiguration({
      testDeviceIdentifiers: ['70229655BD49A6A1C7FD896931E8B71C', 'EMULATOR'],
    });
    const adapterStatuses = await mobileAds().initialize();
    isAdsInitialized = true;
    if (__DEV__) {
      console.log('[AdMob] Initialized successfully:', adapterStatuses);
    }
  } catch (error) {
    console.warn('[AdMob] Initialization failed:', error);
  }
}
