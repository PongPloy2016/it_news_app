import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { INTERSTITIAL_AD_UNIT_ID } from '../config/ads';

let interstitialAd: InterstitialAd | null = null;
let isLoaded = false;
let isLoading = false;
let unsubscribeLoaded: (() => void) | null = null;
let unsubscribeClosed: (() => void) | null = null;
let unsubscribeError: (() => void) | null = null;
let pendingNavigate: (() => void) | null = null;

function setupAdInstance(): void {
  // Clean up any existing listeners
  if (unsubscribeLoaded) {
    unsubscribeLoaded();
    unsubscribeLoaded = null;
  }
  if (unsubscribeClosed) {
    unsubscribeClosed();
    unsubscribeClosed = null;
  }
  if (unsubscribeError) {
    unsubscribeError();
    unsubscribeError = null;
  }

  // Destroy previous ad instance if any
  if (interstitialAd) {
    try {
      interstitialAd.destroy();
    } catch (_) {}
    interstitialAd = null;
  }

  isLoaded = false;
  isLoading = false;

  try {
    interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_AD_UNIT_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    unsubscribeLoaded = interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
      isLoading = false;
      if (__DEV__) {
        console.log('[AdMob Interstitial] Ad loaded and ready to display');
      }
    });

    unsubscribeClosed = interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded = false;
      isLoading = false;
      if (__DEV__) {
        console.log('[AdMob Interstitial] Ad closed by user');
      }

      // Trigger pending navigation callback
      if (pendingNavigate) {
        const fn = pendingNavigate;
        pendingNavigate = null;
        fn();
      }

      // Preload next interstitial ad instance
      setTimeout(() => {
        setupAdInstance();
        loadInterstitialAd();
      }, 500);
    });

    unsubscribeError = interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
      isLoaded = false;
      isLoading = false;
      if (__DEV__) {
        console.warn('[AdMob Interstitial] Ad load error:', error);
      }

      // If user was waiting on navigation, proceed immediately
      if (pendingNavigate) {
        const fn = pendingNavigate;
        pendingNavigate = null;
        fn();
      }

      // Retry loading after 15 seconds
      setTimeout(() => {
        setupAdInstance();
        loadInterstitialAd();
      }, 15000);
    });
  } catch (err) {
    if (__DEV__) {
      console.warn('[AdMob Interstitial] createForAdRequest error:', err);
    }
  }
}

/**
 * Request loading the interstitial ad if not already loaded or loading.
 */
export function loadInterstitialAd(): void {
  if (isLoaded || isLoading) return;

  if (!interstitialAd) {
    setupAdInstance();
  }

  try {
    isLoading = true;
    interstitialAd?.load();
  } catch (error) {
    isLoading = false;
    if (__DEV__) {
      console.warn('[AdMob Interstitial] Failed to call load():', error);
    }
  }
}

/**
 * Initializes the interstitial ad system and preloads the first ad.
 */
export function initInterstitialAd(): void {
  setupAdInstance();
  loadInterstitialAd();
}

/**
 * Shows the interstitial ad if ready, then navigates to the article detail screen.
 * If the ad is not ready, navigation happens immediately without delaying the user.
 *
 * @param onNavigate The navigation function to execute when ad closes or if ad is unavailable
 */
export async function showInterstitialAndNavigate(onNavigate: () => void): Promise<void> {
  if (isLoaded && interstitialAd) {
    let safetyTimer: ReturnType<typeof setTimeout> | null = null;

    pendingNavigate = () => {
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      onNavigate();
    };

    // Safety timeout: If the ad freezes or CLOSED does not fire within 7 seconds, force navigate
    safetyTimer = setTimeout(() => {
      if (pendingNavigate) {
        if (__DEV__) {
          console.warn('[AdMob Interstitial] Safety timeout reached, proceeding with navigation');
        }
        const fn = pendingNavigate;
        pendingNavigate = null;
        fn();
      }
    }, 7000);

    try {
      await interstitialAd.show();
    } catch (showError) {
      if (__DEV__) {
        console.warn('[AdMob Interstitial] Failed to show ad:', showError);
      }
      if (safetyTimer) {
        clearTimeout(safetyTimer);
        safetyTimer = null;
      }
      pendingNavigate = null;
      onNavigate();

      // Reset and reload
      setupAdInstance();
      loadInterstitialAd();
    }
  } else {
    // Ad not loaded yet - navigate immediately so user experience remains fast
    onNavigate();
    loadInterstitialAd();
  }
}
