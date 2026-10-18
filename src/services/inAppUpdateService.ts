import { NativeModules, Platform, Linking } from 'react-native';
import { RemoteAppSettings } from '../types';

export const CURRENT_APP_VERSION = '1.0.2';
export const CURRENT_VERSION_CODE = 6;
export const PLAY_STORE_PACKAGE_NAME = 'com.pongploydev.technewsth.app';
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${PLAY_STORE_PACKAGE_NAME}`;
export const PLAY_STORE_MARKET_URI = `market://details?id=${PLAY_STORE_PACKAGE_NAME}`;

export enum UpdateAvailability {
  UNKNOWN = 0,
  UPDATE_NOT_AVAILABLE = 1,
  UPDATE_AVAILABLE = 2,
  DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS = 3,
}

export enum InstallStatus {
  UNKNOWN = 0,
  PENDING = 1,
  DOWNLOADING = 2,
  DOWNLOADED = 11,
  INSTALLING = 3,
  INSTALLED = 4,
  FAILED = 5,
  CANCELED = 6,
}

export interface InAppUpdateInfo {
  updateAvailability: UpdateAvailability;
  availableVersionCode: number;
  isImmediateAllowed: boolean;
  isFlexibleAllowed: boolean;
  clientVersionStalenessDays: number;
  updatePriority: number;
  installStatus: InstallStatus;
}

export interface UpdateFlowResult {
  status: 'completed' | 'cancelled' | 'failed' | 'unknown';
  resultCode: number;
}

export interface CheckUpdateStatus {
  isUpdateAvailable: boolean;
  isForceUpdate: boolean;
  source: 'google_play' | 'remote_config' | 'none';
  playUpdateInfo?: InAppUpdateInfo;
  remoteSettings?: RemoteAppSettings;
  currentVersion: string;
  currentVersionCode: number;
  targetVersion?: string;
  title: string;
  message: string;
}

const { InAppUpdateModule } = NativeModules;

/**
 * Compare two semver strings (e.g. "1.0.0" and "1.0.1").
 * Returns:
 *   -1 if v1 < v2
 *    1 if v1 > v2
 *    0 if v1 === v2
 */
export function compareSemver(v1: string, v2: string): number {
  const p1 = (v1 || '').split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = (v2 || '').split('.').map((n) => parseInt(n, 10) || 0);
  const maxLen = Math.max(p1.length, p2.length);

  for (let i = 0; i < maxLen; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 < num2) return -1;
    if (num1 > num2) return 1;
  }
  return 0;
}

class InAppUpdateService {
  /**
   * Check whether native InAppUpdateModule is supported on this platform.
   */
  public isSupported(): boolean {
    return Platform.OS === 'android' && Boolean(InAppUpdateModule);
  }

  /**
   * Query Google Play In-App Updates API for update availability on Android.
   */
  public async getPlayUpdateInfo(): Promise<InAppUpdateInfo | null> {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const info: InAppUpdateInfo = await InAppUpdateModule.checkUpdate();
      return info;
    } catch (err: any) {
      console.warn('[InAppUpdateService] checkUpdate failed (normal if not installed from Google Play):', err?.message);
      return null;
    }
  }

  /**
   * Comprehensive check evaluating both Google Play In-App Updates and Supabase Remote Config.
   * Follows Jake Lee's Google Play Force Update architecture.
   */
  public async evaluateUpdateStatus(remoteSettings?: RemoteAppSettings | null): Promise<CheckUpdateStatus> {
    const playInfo = await this.getPlayUpdateInfo();

    const minVersion = remoteSettings?.min_supported_version || '1.0.2';
    const latestVersion = remoteSettings?.latest_version || '1.0.2';
    const remoteMinVersionCode = (remoteSettings as any)?.min_version_code as number | undefined;

    // Check if remote configuration enforces a mandatory update
    const isOutdatedBySemver = compareSemver(CURRENT_APP_VERSION, minVersion) < 0;
    const isOutdatedByVersionCode =
      typeof remoteMinVersionCode === 'number' && remoteMinVersionCode > CURRENT_VERSION_CODE;
    const isRemoteForceUpdateRequired = isOutdatedBySemver || isOutdatedByVersionCode;

    // Check Google Play In-App Updates status
    const isPlayUpdateAvailable =
      playInfo?.updateAvailability === UpdateAvailability.UPDATE_AVAILABLE ||
      playInfo?.updateAvailability === UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS;

    const isPlayImmediateAllowed = Boolean(playInfo?.isImmediateAllowed);

    const title =
      remoteSettings?.force_update_title ||
      'มีเวอร์ชันใหม่พร้อมใช้งาน';
    const message =
      remoteSettings?.force_update_message ||
      'กรุณาอัปเดตเป็นเวอร์ชันล่าสุดเพื่อการใช้งานที่ราบรื่น ปลอดภัย และสัมผัสฟีเจอร์ใหม่ก่อนใคร';

    // Scenario 1: Google Play says update available
    if (isPlayUpdateAvailable) {
      const isForce = false;

      return {
        isUpdateAvailable: true,
        isForceUpdate: isForce,
        source: 'google_play',
        playUpdateInfo: playInfo,
        remoteSettings: remoteSettings || undefined,
        currentVersion: CURRENT_APP_VERSION,
        currentVersionCode: CURRENT_VERSION_CODE,
        targetVersion: playInfo?.availableVersionCode ? `build ${playInfo.availableVersionCode}` : latestVersion,
        title,
        message,
      };
    }

    // Scenario 2: Remote configuration indicates update
    if (isRemoteForceUpdateRequired) {
      return {
        isUpdateAvailable: true,
        isForceUpdate: false,
        source: 'remote_config',
        playUpdateInfo: playInfo || undefined,
        remoteSettings: remoteSettings || undefined,
        currentVersion: CURRENT_APP_VERSION,
        currentVersionCode: CURRENT_VERSION_CODE,
        targetVersion: latestVersion,
        title,
        message,
      };
    }

    // Scenario 3: Optional update indicated by latest_version in remote config
    const isNewerVersionAvailable = compareSemver(CURRENT_APP_VERSION, latestVersion) < 0;
    if (isNewerVersionAvailable) {
      return {
        isUpdateAvailable: true,
        isForceUpdate: false,
        source: 'remote_config',
        playUpdateInfo: playInfo || undefined,
        remoteSettings: remoteSettings || undefined,
        currentVersion: CURRENT_APP_VERSION,
        currentVersionCode: CURRENT_VERSION_CODE,
        targetVersion: latestVersion,
        title: 'มีการอัปเดตใหม่',
        message: 'เวอร์ชันใหม่พร้อมให้ดาวน์โหลดแล้วเพื่อความเสถียรยิ่งขึ้น',
      };
    }

    return {
      isUpdateAvailable: false,
      isForceUpdate: false,
      source: 'none',
      currentVersion: CURRENT_APP_VERSION,
      currentVersionCode: CURRENT_VERSION_CODE,
      title,
      message,
    };
  }

  /**
   * Launch Google's official Immediate In-App Update flow.
   * Displays Google's full-screen native update prompt.
   */
  public async startImmediateUpdate(): Promise<UpdateFlowResult> {
    if (!this.isSupported()) {
      throw new Error('Google Play In-App Updates is only supported on Android devices with Google Play.');
    }

    return await InAppUpdateModule.startUpdate('IMMEDIATE');
  }

  /**
   * Launch Google's official Flexible In-App Update flow.
   * Downloads in background while user continues browsing.
   */
  public async startFlexibleUpdate(): Promise<UpdateFlowResult> {
    if (!this.isSupported()) {
      throw new Error('Google Play In-App Updates is only supported on Android devices with Google Play.');
    }

    return await InAppUpdateModule.startUpdate('FLEXIBLE');
  }

  /**
   * Complete flexible update (restarts app to apply downloaded update).
   */
  public async completeFlexibleUpdate(): Promise<boolean> {
    if (!this.isSupported()) return false;
    return await InAppUpdateModule.completeFlexibleUpdate();
  }

  /**
   * Open the app listing directly in Google Play Store.
   * Uses market:// scheme with https fallback.
   */
  public async openPlayStore(customUrl?: string | null): Promise<void> {
    const targetUrl = customUrl || PLAY_STORE_MARKET_URI;
    try {
      const canOpen = await Linking.canOpenURL(targetUrl);
      if (canOpen) {
        await Linking.openURL(targetUrl);
        return;
      }
    } catch {
      // Ignore and fallback
    }

    try {
      await Linking.openURL(PLAY_STORE_WEB_URL);
    } catch (e: any) {
      console.warn('[InAppUpdateService] Failed to open Google Play Store URL:', e?.message);
    }
  }

  /**
   * Exit the app (for mandatory force updates when user refuses or cancels).
   */
  public exitApp(): void {
    if (this.isSupported() && typeof InAppUpdateModule.exitApp === 'function') {
      InAppUpdateModule.exitApp();
    }
  }
}

export const inAppUpdateService = new InAppUpdateService();
