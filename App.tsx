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
import { oneSignalService } from './src/services/oneSignalService';
import { analyticsService } from './src/services/analyticsService';
import { inAppUpdateService, CheckUpdateStatus } from './src/services/inAppUpdateService';
import { ForceUpdateModal } from './src/components/ForceUpdateModal';
import { FEED_GROUPS } from './src/config/categories';

function resolveThaiScreenInfo(route?: { name: string; params?: any }): {
  screenName: string;
  screenClass: string;
  pageTitle: string;
  extraParams?: Record<string, any>;
} {
  if (!route) {
    return {
      screenName: 'หน้าแรก - รวมทุกหมวด',
      screenClass: 'LatestScreen',
      pageTitle: 'หน้าแรก - รวมทุกหมวด',
    };
  }

  switch (route.name) {
    case 'Latest':
    case 'DrawerHome':
      return {
        screenName: 'หน้าแรก - รวมทุกหมวด',
        screenClass: 'LatestScreen',
        pageTitle: 'หน้าแรก - รวมทุกหมวด',
      };
    case 'CategoryDetail': {
      const groupKey = route.params?.groupKey;
      const group = FEED_GROUPS.find((g) => g.key === groupKey);
      const label = group?.label || 'หมวดหมู่ข่าว';
      return {
        screenName: `หมวดหมู่ - ${label}`,
        screenClass: 'CategoryDetailScreen',
        pageTitle: `หมวดหมู่ - ${label}`,
        extraParams: { category: label, category_id: groupKey },
      };
    }
    case 'Article': {
      const art = route.params?.article;
      return {
        screenName: 'อ่านข่าว',
        screenClass: 'ArticleDetailScreen',
        pageTitle: art?.title ? `อ่านข่าว: ${art.title.slice(0, 60)}` : 'อ่านข่าว',
      };
    }
    case 'Categories':
      return {
        screenName: 'หมวดหมู่ข่าวสารทั้งหมด',
        screenClass: 'CategoriesScreen',
        pageTitle: 'หมวดหมู่ข่าวสารทั้งหมด',
      };
    case 'Bookmarks':
      return {
        screenName: 'ข่าวที่บันทึกไว้',
        screenClass: 'BookmarksScreen',
        pageTitle: 'ข่าวที่บันทึกไว้',
      };
    case 'Search':
      return {
        screenName: 'ค้นหาข่าวสาร',
        screenClass: 'SearchScreen',
        pageTitle: 'ค้นหาข่าวสาร',
      };
    case 'Settings':
      return {
        screenName: 'ตั้งค่าระบบ',
        screenClass: 'SettingsScreen',
        pageTitle: 'ตั้งค่าระบบ',
      };
    case 'WebView':
      return {
        screenName: 'เว็บต้นฉบับข่าว',
        screenClass: 'WebViewScreen',
        pageTitle: route.params?.title ? `เว็บต้นฉบับ: ${route.params.title.slice(0, 50)}` : 'เว็บต้นฉบับข่าว',
      };
    default:
      return {
        screenName: route.name,
        screenClass: route.name,
        pageTitle: route.name,
      };
  }
}

function AppShell() {
  const { colors, isDark, remoteSettings } = useNews();
  const navigationRef = useNavigationContainerRef<any>();
  const routeKeyRef = useRef<string | undefined>(undefined);
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

    // Initialize OneSignal SDK with Push Subscription Verification Dialog
    oneSignalService.initialize();

    // Set up FCM foreground & background listeners
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
          routeKeyRef.current = currentRoute?.key;
          if (currentRoute) {
            const info = resolveThaiScreenInfo(currentRoute);
            void analyticsService.logScreenView(info.screenName, info.screenClass, {
              page_title: info.pageTitle,
              ...info.extraParams,
            });
          }
        }}
        onStateChange={() => {
          const previousRouteKey = routeKeyRef.current;
          const currentRoute = navigationRef.getCurrentRoute();
          const currentRouteKey = currentRoute?.key;

          if (currentRoute && previousRouteKey !== currentRouteKey) {
            routeKeyRef.current = currentRouteKey;
            const info = resolveThaiScreenInfo(currentRoute);
            void analyticsService.logScreenView(info.screenName, info.screenClass, {
              page_title: info.pageTitle,
              ...info.extraParams,
            });
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
