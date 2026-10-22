import { ScrollView } from 'react-native';
import { UnderlineTabItem } from '../../components/UnderlineTabBar';
import { FeedGroup, FeedSource } from '../../config';
import { AppSettings, NewsArticle } from '../../types';

export type StatusFilter = 'all' | 'new' | 'read';

export interface LatestViewModel {
  // Navigation & Screen context
  colors: any;
  scale: number;
  isDark: boolean;
  settings: AppSettings;

  // Tab & Category State
  activeGroupKey: string;
  activeGroup?: FeedGroup;
  feedGroups: FeedGroup[];
  categoryTabs: UnderlineTabItem[];
  selectedFeed: FeedSource;
  selectedFeedKey: string;
  activeSources: FeedSource[];
  isHtmlFeed: boolean;

  // Articles & Data
  articles: NewsArticle[];
  filteredArticles: NewsArticle[];
  visibleArticles: NewsArticle[];
  visibleCount: number;
  hasMore: boolean;
  newArticlesCount: number;
  readArticlesCount: number;
  bookmarks: Record<string, NewsArticle>;
  lastRefreshNewCount: number;
  lastUpdated?: number;
  isShowingCachedFeed: boolean;

  // Status Filter ('all' | 'new' | 'read')
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;

  // Home Editorial Sections ("รวมทุกหมวด")
  categorySections: Record<string, NewsArticle[]>;
  isSectionsLoading: boolean;
  loadProgress: number;
  loadingStageText: string;
  heroArticles: NewsArticle[];
  highlightArticles: NewsArticle[];
  tickerArticles: NewsArticle[];
  totalAllArticlesCount: number;
  homeScrollRef: React.RefObject<ScrollView | null>;

  // Loading & Error States
  isRefreshing: boolean;
  isInitialLoading: boolean;
  isSwitchingFeed: boolean;
  isWaitingForLoading: boolean;
  hasFetchError: boolean;

  // Actions
  handleRefreshAll: (force?: boolean) => Promise<void>;
  handlePressArticle: (
    item: NewsArticle,
    customArticles?: NewsArticle[],
    categoryKey?: string,
    categoryLabel?: string,
  ) => void;
  handleViewAllCategory: (groupKey: string) => void;
  handleSelectCategoryQuickNav: (groupKey: string) => void;
  handleCategoryTabChange: (key: string) => void;
  handleSourceSelect: (key: string) => void;
  handleLayoutToggle: () => void;
  handleEndReached: () => void;
  toggleBookmark: (article: NewsArticle) => void;
  markAllAsRead: () => void;
  clearFreshCount: () => void;
  setCategoryLayout: (key: string, y: number) => void;
}
