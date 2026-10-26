import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EdgeInsets } from 'react-native-safe-area-context';
import {
  AppSettings,
  CardLayoutOption,
  FontSizeOption,
  LinkOpenMode,
  NewsArticle,
  RemoteAppSettings,
  ThemeMode,
} from '../../types';

export interface ThemeOption {
  key: ThemeMode;
  title: string;
  accent: string;
}

export interface SettingsViewModel {
  insets: EdgeInsets;
  articles: NewsArticle[];
  bookmarks: Record<string, NewsArticle>;
  searchHistory: string[];
  readArticles: Record<string, number>;
  settings: AppSettings;
  remoteSettings: RemoteAppSettings;
  colors: any;
  scale: number;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setFontSize: (size: FontSizeOption) => void;
  setCardLayout: (layout: CardLayoutOption) => void;
  setAiReaderEnabled: (enabled: boolean) => void;
  setLinkOpenMode: (mode: LinkOpenMode) => void;
  setDataSaverEnabled: (enabled: boolean) => void;
  clearNewsCache: () => Promise<void>;
  clearBookmarks: () => void;
  clearReadArticles: () => Promise<void>;
  clearSearchHistory: () => void;
  syncCloudBookmarks: () => Promise<{ success: boolean; count: number; error?: string }>;
  isSyncingBookmarks: boolean;
  importBookmarksFromDevice: (deviceId: string) => Promise<{ success: boolean; count: number; error?: string }>;
  isCloudSyncActive: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
  language: 'th' | 'en' | 'system';
  resolvedLanguage: 'th' | 'en';
  setLanguage: (lang: 'th' | 'en' | 'system') => void;
  t: any;

  // Local state & handlers
  deviceId: string;
  isManualSyncing: boolean;
  isImportModalVisible: boolean;
  setIsImportModalVisible: (visible: boolean) => void;
  targetDeviceId: string;
  setTargetDeviceId: (id: string) => void;
  isImporting: boolean;
  isFeedbackModalVisible: boolean;
  setIsFeedbackModalVisible: (visible: boolean) => void;
  feedbackCategory: 'bug' | 'suggest_feed' | 'general';
  setFeedbackCategory: (category: 'bug' | 'suggest_feed' | 'general') => void;
  feedbackMessage: string;
  setFeedbackMessage: (msg: string) => void;
  feedbackContact: string;
  setFeedbackContact: (contact: string) => void;
  isSubmitting: boolean;
  isThemeDropdownOpen: boolean;
  toggleThemeDropdown: () => void;
  closeThemeDropdown: () => void;
  handleManualSync: () => Promise<void>;
  handleShareDeviceId: () => Promise<void>;
  handleImportBookmarks: () => Promise<void>;
  handleSubmitFeedback: () => Promise<void>;

  // Metrics
  readCount: number;
  historyCount: number;
  bookmarkCount: number;
  cacheCount: number;
}

export interface SectionProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradientColors: [string, string];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}
