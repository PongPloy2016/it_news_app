import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NewsProvider, useNews } from './src/store/NewsContext';
import { RootNavigator } from './src/navigation/RootNavigator';

import { useEffect } from 'react';
import { initializeMobileAds } from './src/config/ads';
import { initInterstitialAd } from './src/services/interstitialService';
import { crashlyticsService } from './src/services/crashlyticsService';
import { notificationService } from './src/services/notificationService';

function AppShell() {
  const { colors, isDark, remoteSettings } = useNews();

  useEffect(() => {
    crashlyticsService.log('App initialized');

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
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </NavigationContainer>
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
