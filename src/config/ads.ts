import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

export const ADMOB_APP_ID = 'ca-app-pub-4252101594093237~5088377311';
export const PRODUCTION_BANNER_AD_UNIT_ID = 'ca-app-pub-4252101594093237/3628558622';
export const PRODUCTION_INTERSTITIAL_AD_UNIT_ID = 'ca-app-pub-7344555333906095/9939973650';

/**
 * Flag to force Test Ads across the entire app.
 * Set to true: Always serves Google official Test Ads (TestIds.BANNER, TestIds.INTERSTITIAL)
 * Set to false: Uses real production Ad Unit IDs.
 */
export const USE_TEST_ADS = false;

// Google official sample/test ad units (Safe for development and store testing)
export const TEST_BANNER_AD_UNIT_ID = TestIds.BANNER;
export const TEST_INTERSTITIAL_AD_UNIT_ID = TestIds.INTERSTITIAL;

export const BANNER_AD_UNIT_ID = USE_TEST_ADS ? TEST_BANNER_AD_UNIT_ID : PRODUCTION_BANNER_AD_UNIT_ID;
export const INTERSTITIAL_AD_UNIT_ID = USE_TEST_ADS ? TEST_INTERSTITIAL_AD_UNIT_ID : PRODUCTION_INTERSTITIAL_AD_UNIT_ID;

/**
 * Returns the effective Banner Ad Unit ID. If USE_TEST_ADS is true, forces Google Test Banner.
 */
export function getBannerAdUnitId(remoteId?: string | null): string {
  if (USE_TEST_ADS) {
    return TEST_BANNER_AD_UNIT_ID;
  }
  return remoteId || PRODUCTION_BANNER_AD_UNIT_ID || TEST_BANNER_AD_UNIT_ID;
}

/**
 * Returns the effective Interstitial Ad Unit ID. If USE_TEST_ADS is true, forces Google Test Interstitial.
 */
export function getInterstitialAdUnitId(remoteId?: string | null): string {
  if (USE_TEST_ADS) {
    return TEST_INTERSTITIAL_AD_UNIT_ID;
  }
  return remoteId || PRODUCTION_INTERSTITIAL_AD_UNIT_ID || TEST_INTERSTITIAL_AD_UNIT_ID;
}

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
