import { NavigationContainer, DarkTheme, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NewsProvider, useNews } from './src/store/NewsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

import { useEffect, useRef, useState } from 'react';
import { initializeMobileAds } from './src/config/ads';
import { initInterstitialAd } from './src/services/interstitialService';
import { crashlyticsService } from './src/services/crashlyticsService';
import { notificationService } from './src/services/notificationService';
import { analyticsService } from './src/services/analyticsService';
import { inAppUpdateService, CheckUpdateStatus } from './src/services/inAppUpdateService';
import { ForceUpdateModal } from './src/components/ForceUpdateModal';

function AppShell() {
  const { colors, isDark, remoteSettings } = useNews();
  const navigationRef = useNavigationContainerRef<any>();
  const routeNameRef = useRef<string | undefined>(undefined);
  const [updateStatus, setUpdateStatus] = useState<CheckUpdateStatus | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Google Play In-App Update / Force Update Check (Jake Lee Architecture)
    const checkAppUpdate = async () => {
      try {
        const status = await inAppUpdateService.evaluateUpdateStatus(remoteSettings);
        if (!isMounted) return;

        if (status.isUpdateAvailable) {
          // If Google Play native In-App Update (Immediate) is available and allowed, launch Google's official immediate flow
          if (
            status.source === 'google_play' &&
            status.playUpdateInfo?.isImmediateAllowed &&
            status.isForceUpdate
          ) {
            try {
              const result = await inAppUpdateService.startImmediateUpdate();
              if (result.status === 'cancelled') {
                // If user cancels mandatory update, display blocking modal
                setUpdateStatus(status);
                setShowUpdateModal(true);
              }
            } catch (flowErr) {
              console.warn('[App] Google Play In-App Update flow error, showing modal fallback:', flowErr);
              setUpdateStatus(status);
              setShowUpdateModal(true);
            }
          } else {
            // Show custom in-app update prompt (covers remote config force update or flexible update)
            setUpdateStatus(status);
            setShowUpdateModal(true);
          }
        }
      } catch (err) {
        console.warn('[App] Failed to check for app update:', err);
      }
    };

    void checkAppUpdate();

    return () => {
      isMounted = false;
    };
  }, [remoteSettings]);

  useEffect(() => {
    crashlyticsService.log('App initialized');
    void analyticsService.logAppOpen();

    // Request notification permission and retrieve FCM token
    void notificationService.requestPermission().then((granted) => {
      if (granted) {
        void notificationService.getFCMToken();
      }
    });

    // Set up foreground & background listeners
    const unsubscribeNotifications = notificationService.setupListeners();

    if (remoteSettings.ads_enabled) {
      void initializeMobileAds().then(() => {
        if (remoteSettings.interstitial_ads_enabled) {
          initInterstitialAd();
        }
      });
    }

    return () => {
      unsubscribeNotifications();
    };
  }, [remoteSettings.ads_enabled, remoteSettings.interstitial_ads_enabled]);
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer
        ref={navigationRef}
        theme={navigationTheme}
        onReady={() => {
          const currentRoute = navigationRef.getCurrentRoute();
          routeNameRef.current = currentRoute?.name;
          if (currentRoute?.name) {
            void analyticsService.logScreenView(currentRoute.name);
          }
        }}
        onStateChange={() => {
          const previousRouteName = routeNameRef.current;
          const currentRoute = navigationRef.getCurrentRoute();
          const currentRouteName = currentRoute?.name;

          if (currentRouteName && previousRouteName !== currentRouteName) {
            routeNameRef.current = currentRouteName;
            void analyticsService.logScreenView(currentRouteName);
          }
        }}
      >
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
      <ForceUpdateModal
        visible={showUpdateModal}
        updateStatus={updateStatus}
        onDismiss={() => setShowUpdateModal(false)}
      />
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NewsProvider>
        <AppShell />
      </NewsProvider>
    </SafeAreaProvider>
  );
}
