import { EdgeInsets } from 'react-native-safe-area-context';
import { FeedGroup } from '../../config/categories';
import { FeedSource } from '../../config/feeds';
import { CategoryVisual } from '../../config/categoryVisuals';
import { AppSettings, NewsArticle } from '../../types';

export interface CategoryDetailViewModel {
  currentGroup?: FeedGroup;
  visual: CategoryVisual;
  sources: FeedSource[];
  selectedSourceKey: string;
  categoryArticles: NewsArticle[];
  isLoading: boolean;
  isRefreshing: boolean;
  colors: any;
  scale: number;
  isDark: boolean;
  insets: EdgeInsets;
  settings: AppSettings;
  bookmarks: Record<string, NewsArticle>;
  channelStats: Record<string, { total: number; newCount: number }>;
  handleSelectSource: (key: string) => void;
  onRefresh: () => void;
  handleOpenArticle: (article: NewsArticle) => void;
  handleSetMainFeedAndGoHome: (source: FeedSource) => void;
  toggleBookmark: (article: NewsArticle) => void;
  goBack: () => void;
  openSearch: () => void;
}
