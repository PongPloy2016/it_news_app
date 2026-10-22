import {
  OneSignal,
  LogLevel,
  NotificationClickEvent,
  NotificationWillDisplayEvent,
} from 'react-native-onesignal';

export const ONESIGNAL_APP_ID = '676e68bf-bbce-4431-989b-1ba830b540cf';

/**
 * Centralized OneSignal Service wrapper.
 * All OneSignal interactions go through this module.
 */
export const oneSignalService = {
  isInitialized: false,

  /**
   * Initializes the OneSignal SDK.
   */
  initialize(appId: string = ONESIGNAL_APP_ID): void {
    if (this.isInitialized) return;

    try {
      // Set log level for warnings/errors only
      OneSignal.Debug.setLogLevel(LogLevel.Warn);

      // Initialize OneSignal with App ID
      OneSignal.initialize(appId);
      this.isInitialized = true;
      // Pause default OneSignal In-App Messages so the app's custom UI handles welcome and permission
      OneSignal.InAppMessages.setPaused(true);

      // Set up default notification listeners
      this.setupNotificationListeners();
    } catch (error) {
      console.warn('[OneSignalService] Initialization failed:', error);
    }
  },

  /**
   * Control whether In-App Messages are paused.
   */
  setInAppMessagesPaused(paused: boolean): void {
    try {
      OneSignal.InAppMessages.setPaused(paused);
    } catch (error) {
      console.warn('[OneSignalService] setInAppMessagesPaused error:', error);
    }
  },

  /**
   * Request push notification permission.
   */
  async requestPermission(fallbackToSettings: boolean = true): Promise<boolean> {
    try {
      const granted = await OneSignal.Notifications.requestPermission(fallbackToSettings);
      console.log('[OneSignalService] Notification permission result:', granted);
      return granted;
    } catch (error) {
      console.warn('[OneSignalService] requestPermission error:', error);
      return false;
    }
  },

  /**
   * Check if push notification permission is granted.
   */
  async getPermissionAsync(): Promise<boolean> {
    try {
      return await OneSignal.Notifications.getPermissionAsync();
    } catch {
      return false;
    }
  },

  /**
   * Get server-assigned push subscription ID.
   */
  async getPushSubscriptionId(): Promise<string | null> {
    try {
      return await OneSignal.User.pushSubscription.getIdAsync();
    } catch {
      return null;
    }
  },

  /**
   * Set up event listeners for notification click and foreground display.
   */
  setupNotificationListeners(callbacks?: {
    onClick?: (event: NotificationClickEvent) => void;
    onForegroundWillDisplay?: (event: NotificationWillDisplayEvent) => void;
  }): () => void {
    const clickListener = (event: NotificationClickEvent) => {
      console.log('[OneSignalService] Notification clicked:', event);
      callbacks?.onClick?.(event);
    };

    const foregroundListener = (event: NotificationWillDisplayEvent) => {
      console.log('[OneSignalService] Foreground notification will display:', event);
      callbacks?.onForegroundWillDisplay?.(event);
    };

    OneSignal.Notifications.addEventListener('click', clickListener);
    OneSignal.Notifications.addEventListener('foregroundWillDisplay', foregroundListener);

    return () => {
      OneSignal.Notifications.removeEventListener('click', clickListener);
      OneSignal.Notifications.removeEventListener('foregroundWillDisplay', foregroundListener);
    };
  },

  /**
   * Identify user with external user ID.
   */
  login(externalId: string): void {
    try {
      OneSignal.login(externalId);
    } catch (error) {
      console.warn('[OneSignalService] login error:', error);
    }
  },

  /**
   * Clear user identity on logout.
   */
  logout(): void {
    try {
      OneSignal.logout();
    } catch (error) {
      console.warn('[OneSignalService] logout error:', error);
    }
  },

  /**
   * Add email subscription.
   */
  addEmail(email: string): void {
    try {
      OneSignal.User.addEmail(email);
    } catch (error) {
      console.warn('[OneSignalService] addEmail error:', error);
    }
  },

  /**
   * Remove email subscription.
   */
  removeEmail(email: string): void {
    try {
      OneSignal.User.removeEmail(email);
    } catch (error) {
      console.warn('[OneSignalService] removeEmail error:', error);
    }
  },

  /**
   * Add SMS subscription.
   */
  addSms(phone: string): void {
    try {
      OneSignal.User.addSms(phone);
    } catch (error) {
      console.warn('[OneSignalService] addSms error:', error);
    }
  },

  /**
   * Remove SMS subscription.
   */
  removeSms(phone: string): void {
    try {
      OneSignal.User.removeSms(phone);
    } catch (error) {
      console.warn('[OneSignalService] removeSms error:', error);
    }
  },

  /**
   * Add tag for current user.
   */
  addTag(key: string, value: string): void {
    try {
      OneSignal.User.addTag(key, value);
    } catch (error) {
      console.warn('[OneSignalService] addTag error:', error);
    }
  },

  /**
   * Add multiple tags for current user.
   */
  addTags(tags: Record<string, string>): void {
    try {
      OneSignal.User.addTags(tags);
    } catch (error) {
      console.warn('[OneSignalService] addTags error:', error);
    }
  },

  /**
   * Remove tag from current user.
   */
  removeTag(key: string): void {
    try {
      OneSignal.User.removeTag(key);
    } catch (error) {
      console.warn('[OneSignalService] removeTag error:', error);
    }
  },

  /**
   * Remove multiple tags from current user.
   */
  removeTags(keys: string[]): void {
    try {
      OneSignal.User.removeTags(keys);
    } catch (error) {
      console.warn('[OneSignalService] removeTags error:', error);
    }
  },

  /**
   * Set logging level.
   */
  setLogLevel(level: LogLevel): void {
    try {
      OneSignal.Debug.setLogLevel(level);
    } catch (error) {
      console.warn('[OneSignalService] setLogLevel error:', error);
    }
  },
};

export default oneSignalService;
