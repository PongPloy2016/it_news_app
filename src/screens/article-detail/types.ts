import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Animated, FlatList } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { NewsArticle, RootStackParamList } from '../../types';

export interface ArticleCategoryInfo {
  key: string;
  label: string;
}

export interface ArticleDetailViewModel {
  insets: EdgeInsets;
  screenWidth: number;
  screenHeight: number;
  heroHeight: number;
  colors: any;
  scale: number;
  isDark: boolean;
  initialArticle: NewsArticle | undefined;
  articleCategory: ArticleCategoryInfo;
  resolvedArticleList: NewsArticle[];
  initialIndex: number;
  currentIndex: number;
  categoryShortTitle: string;
  flatListRef: React.RefObject<FlatList<NewsArticle> | null>;
  hasUserNavigatedRef: React.MutableRefObject<boolean>;
  viewerVisible: boolean;
  viewerImages: string[];
  viewerInitialIndex: number;
  setViewerVisible: (visible: boolean) => void;
  setViewerImages: (images: string[]) => void;
  setViewerInitialIndex: (index: number) => void;
  fontScaleMultiplier: number;
  setFontScaleMultiplier: (scale: number | ((prev: number) => number)) => void;
  toastAnim: Animated.Value;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  handlePrev: () => void;
  handleNext: () => void;
  onMomentumScrollEnd: (event: any) => void;
  navigation: NativeStackNavigationProp<RootStackParamList, 'Article'>;
}
