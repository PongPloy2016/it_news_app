export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSizeOption = 'small' | 'medium' | 'large';
export type CardLayoutOption = 'compact' | 'magazine';

export interface AppSettings {
  themeMode: ThemeMode;
  fontSize: FontSizeOption;
  cardLayout: CardLayoutOption;
  aiReaderEnabled: boolean;
}

export interface RemoteAppSettings {
  id: string;
  is_ai_enabled: boolean;
  ai_model_name: string;
  ai_max_tokens: number;
  tts_default_rate: number;
  ads_enabled: boolean;
  banner_ads_enabled: boolean;
  interstitial_ads_enabled: boolean;
  interstitial_interval_clicks: number;
  interstitial_min_delay_sec: number;
  admob_banner_id_android?: string | null;
  admob_interstitial_id_android?: string | null;
  min_supported_version: string;
  latest_version: string;
  force_update_title?: string | null;
  force_update_message?: string | null;
  is_maintenance: boolean;
  maintenance_message?: string | null;
  privacy_policy_url?: string | null;
  terms_url?: string | null;
  support_email?: string | null;
  play_store_url?: string | null;
  announcement_active: boolean;
  announcement_message?: string | null;
  breaking_news_active: boolean;
  breaking_news_text?: string | null;
  breaking_news_url?: string | null;
  default_feed_key: string;
  cache_ttl_minutes: number;
  updated_at?: string;
}

export interface AppFeedback {
  category: 'bug' | 'suggest_feed' | 'general';
  message: string;
  contact?: string;
  app_version?: string;
  device_platform?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  author?: string;
  publishedAt?: string;
  publishedMillis?: number;
  readingTime: number;
}

export type RootStackParamList = {
  MainTabs: undefined;
  Article: { articleId: string };
  WebView: { url: string; title?: string };
};

export type MainTabParamList = {
  Latest: undefined;
  Search: undefined;
  Bookmarks: undefined;
  Settings: undefined;
};
