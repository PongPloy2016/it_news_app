import { getCrashlytics } from '@react-native-firebase/crashlytics';

/**
 * Service to manage Firebase Crashlytics logging and error reporting.
 */
export const crashlyticsService = {
  /**
   * Log a breadcrumb/custom message to Crashlytics session
   */
  log(message: string): void {
    try {
      getCrashlytics().log(message);
    } catch (err) {
      console.warn('[Crashlytics] Failed to log:', err);
    }
  },

  /**
   * Record a non-fatal error to Crashlytics
   */
  recordError(error: Error, jsErrorName?: string): void {
    try {
      getCrashlytics().recordError(error, jsErrorName);
    } catch (err) {
      console.warn('[Crashlytics] Failed to record error:', err);
    }
  },

  /**
   * Set user identifier for crash grouping
   */
  setUserId(userId: string): void {
    try {
      void getCrashlytics().setUserId(userId);
    } catch (err) {
      console.warn('[Crashlytics] Failed to set user ID:', err);
    }
  },

  /**
   * Set custom key-value attribute
   */
  setAttribute(key: string, value: string): void {
    try {
      void getCrashlytics().setAttribute(key, value);
    } catch (err) {
      console.warn('[Crashlytics] Failed to set attribute:', err);
    }
  },

  /**
   * Force crash for verifying Crashlytics setup in testing
   */
  crash(): void {
    getCrashlytics().crash();
  },
};

export default crashlyticsService;
