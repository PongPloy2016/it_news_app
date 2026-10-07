import { supabase } from '../config/supabase';
import { storage } from '../data/database';
import { AppFeedback, RemoteAppSettings } from '../types';

export const CACHE_KEY_REMOTE_SETTINGS = 'it_news.supabase_app_settings';

export const DEFAULT_REMOTE_SETTINGS: RemoteAppSettings = {
  id: 'default',
  is_ai_enabled: true,
  ai_model_name: 'gemini-1.5-flash',
  ai_max_tokens: 400,
  tts_default_rate: 0.95,
  ads_enabled: false,
  banner_ads_enabled: false,
  interstitial_ads_enabled: false,
  interstitial_interval_clicks: 4,
  interstitial_min_delay_sec: 60,
  admob_banner_id_android: null,
  admob_interstitial_id_android: null,
  min_supported_version: '1.0.0',
  latest_version: '1.0.0',
  force_update_title: 'มีเวอร์ชันใหม่พร้อมใช้งาน',
  force_update_message: 'กรุณาอัปเดตเป็นเวอร์ชันล่าสุดเพื่อการใช้งานที่ราบรื่นและปลอดภัย',
  is_maintenance: false,
  maintenance_message: 'ระบบกำลังปิดปรับปรุงชั่วคราว ทีมงานกำลังเร่งแก้ไขครับ',
  privacy_policy_url: 'https://pongploydev.github.io/privacy-policy',
  terms_url: 'https://pongploydev.github.io/terms',
  support_email: 'pongku71@gmail.com',
  play_store_url: 'https://play.google.com/store/apps/details?id=com.pongploydev.technewsth.app',
  announcement_active: false,
  announcement_message: null,
  breaking_news_active: false,
  breaking_news_text: null,
  breaking_news_url: null,
  default_feed_key: 'tech-business',
  cache_ttl_minutes: 15,
  default_card_layout: 'magazine',
  default_theme_mode: 'system',
  default_link_open_mode: 'in_app',
  default_font_size: 'medium',
  data_saver_default: false,
  cloud_sync_enabled: true,
  related_news_limit: 10,
  rss_source_name: 'Blognone',
  rss_source_url: 'https://www.blognone.com',
  contact_custom_url: null,
};

let inMemoryRemoteSettings: RemoteAppSettings = DEFAULT_REMOTE_SETTINGS;

/**
 * Fetch remote app settings from Supabase, falling back to local cache or defaults.
 */
export async function fetchRemoteAppSettings(): Promise<RemoteAppSettings> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.warn('[appSettingsService] Supabase query error:', error.message);
      return getCachedRemoteAppSettings();
    }

    if (data) {
      const merged: RemoteAppSettings = {
        ...DEFAULT_REMOTE_SETTINGS,
        ...data,
      };
      inMemoryRemoteSettings = merged;
      await storage.set(CACHE_KEY_REMOTE_SETTINGS, merged);
      return merged;
    }
  } catch (err) {
    console.warn('[appSettingsService] Failed to fetch remote settings:', err);
  }

  return getCachedRemoteAppSettings();
}

/**
 * Get locally cached remote settings, or default fallback.
 */
export async function getCachedRemoteAppSettings(): Promise<RemoteAppSettings> {
  try {
    const cached = await storage.get<RemoteAppSettings>(CACHE_KEY_REMOTE_SETTINGS);
    if (cached) {
      inMemoryRemoteSettings = {
        ...DEFAULT_REMOTE_SETTINGS,
        ...cached,
      };
      return inMemoryRemoteSettings;
    }
  } catch (err) {
    console.warn('[appSettingsService] Error reading cached remote settings:', err);
  }
  return inMemoryRemoteSettings;
}

/**
 * Get current in-memory remote settings synchronously.
 */
export function getCurrentRemoteSettings(): RemoteAppSettings {
  return inMemoryRemoteSettings;
}

/**
 * Submit user feedback or bug report to Supabase app_feedbacks table.
 */
export async function submitAppFeedback(
  feedback: AppFeedback,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('app_feedbacks').insert([
      {
        category: feedback.category,
        message: feedback.message,
        contact: feedback.contact ?? null,
        app_version: feedback.app_version ?? '1.0.0',
        device_platform: feedback.device_platform ?? 'android',
      },
    ]);

    if (error) {
      console.warn('[appSettingsService] Submit feedback error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}
