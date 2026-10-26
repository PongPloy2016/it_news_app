import { EdgeInsets } from 'react-native-safe-area-context';
import { AppSettings, NewsArticle } from '../../types';

export interface SearchViewModel {
  query: string;
  setQuery: (q: string) => void;
  results: NewsArticle[];
  searchHistory: string[];
  colors: any;
  scale: number;
  settings: AppSettings;
  bookmarks: Record<string, NewsArticle>;
  insets: EdgeInsets;
  handleArticlePress: (item: NewsArticle) => void;
  handleHistoryPress: (term: string) => void;
  handleSearchSubmit: () => void;
  handleClearSearchHistory: () => void;
  toggleBookmark: (article: NewsArticle) => void;
}
