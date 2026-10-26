import { EdgeInsets } from 'react-native-safe-area-context';
import { FeedGroup } from '../../config/categories';
import { CategoryVisual } from '../../config/categoryVisuals';

export interface CategoryGroupWithStats extends FeedGroup {
  visual: CategoryVisual;
  sourceCount: number;
  totalArticles: number;
  newCount: number;
}

export interface CategoriesViewModel {
  filteredGroups: CategoryGroupWithStats[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isRefreshing: boolean;
  handleRefresh: () => void;
  handleCategoryPress: (item: CategoryGroupWithStats) => void;
  colors: any;
  scale: number;
  isDark: boolean;
  insets: EdgeInsets;
}
