import { EdgeInsets } from 'react-native-safe-area-context';
import { AppSettings, NewsArticle, RemoteAppSettings } from '../../types';

export interface SourceFilterItem {
  key: string;
  label: string;
  count: number;
}

export interface BookmarksViewModel {
  allArticles: NewsArticle[];
  filteredArticles: NewsArticle[];
  availableSources: SourceFilterItem[];
  selectedSource: string;
  setSelectedSource: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isCloudSyncActive: boolean;
  setCloudSyncEnabled: (val: boolean) => void;
  isSyncingBookmarks: boolean;
  isManualSyncing: boolean;
  lastSyncedTime: Date | null;
  syncFeedback: string | null;
  handleSyncDown: (triggerSkeleton?: boolean) => Promise<void>;
  handleConfirmClearAll: () => void;
  handleArticlePress: (item: NewsArticle) => void;
  toggleBookmark: (article: NewsArticle) => void;
  colors: any;
  scale: number;
  isDark: boolean;
  insets: EdgeInsets;
  settings: AppSettings;
  remoteSettings: RemoteAppSettings;
}
