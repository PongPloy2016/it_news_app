import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { getMessaging } from '@react-native-firebase/messaging';
import type { RemoteMessage } from '@react-native-firebase/messaging';

/**
 * Service to manage Firebase Cloud Messaging (FCM) push notifications.
 */
export const notificationService = {
  /**
   * Request permission to receive push notifications.
   * Handles Android 13+ (POST_NOTIFICATIONS) and iOS authorization.
   */
  async requestPermission(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        const authStatus = await getMessaging().requestPermission();
        const enabled =
          authStatus === 1 || // AuthorizationStatus.AUTHORIZED
          authStatus === 2; // AuthorizationStatus.PROVISIONAL
        return enabled;
      }
    } catch (error) {
      console.warn('[NotificationService] Request permission failed:', error);
      return false;
    }
  },

  /**
   * Retrieve the device's FCM registration token.
   */
  async getFCMToken(): Promise<string | null> {
    try {
      const messaging = getMessaging();
      const token = await messaging.getToken();
      console.log('[NotificationService] FCM Token:', token);
      return token;
    } catch (error) {
      console.warn('[NotificationService] Get FCM token error:', error);
      return null;
    }
  },

  /**
   * Listen for token refreshes.
   */
  onTokenRefresh(callback: (token: string) => void): () => void {
    try {
      return getMessaging().onTokenRefresh(callback);
    } catch (error) {
      console.warn('[NotificationService] onTokenRefresh error:', error);
      return () => {};
    }
  },

  /**
   * Subscribe to a topic (e.g. 'news', 'breaking_news').
   */
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await getMessaging().subscribeToTopic(topic);
      console.log(`[NotificationService] Subscribed to topic: ${topic}`);
    } catch (error) {
      console.warn(`[NotificationService] Subscribe to topic ${topic} error:`, error);
    }
  },

  /**
   * Unsubscribe from a topic.
   */
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await getMessaging().unsubscribeFromTopic(topic);
      console.log(`[NotificationService] Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.warn(`[NotificationService] Unsubscribe from topic ${topic} error:`, error);
    }
  },

  /**
   * Setup listeners for foreground notifications and notification clicks.
   */
  setupListeners(callbacks?: {
    onForegroundMessage?: (message: RemoteMessage) => void;
    onNotificationOpened?: (message: RemoteMessage) => void;
  }): () => void {
    const messaging = getMessaging();

    // 1. Foreground message handler
    const unsubscribeForeground = messaging.onMessage(async (remoteMessage) => {
      console.log('[NotificationService] Foreground message received:', remoteMessage);

      if (callbacks?.onForegroundMessage) {
        callbacks.onForegroundMessage(remoteMessage);
      } else {
        // Default display alert if in foreground
        const title = remoteMessage.notification?.title || 'TechThaiNews';
        const body = remoteMessage.notification?.body || '';
        if (title || body) {
          Alert.alert(title, body);
        }
      }
    });

    // 2. Notification opened from background
    const unsubscribeNotificationOpened = messaging.onNotificationOpenedApp((remoteMessage) => {
      console.log('[NotificationService] App opened from background by notification:', remoteMessage);
      callbacks?.onNotificationOpened?.(remoteMessage);
    });

    // 3. App opened from quit/killed state
    messaging
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('[NotificationService] App opened from quit state by notification:', remoteMessage);
          callbacks?.onNotificationOpened?.(remoteMessage);
        }
      })
      .catch((err) => {
        console.warn('[NotificationService] getInitialNotification error:', err);
      });

    return () => {
      unsubscribeForeground();
      unsubscribeNotificationOpened();
    };
  },
};

export default notificationService;
