export type ThemeMode = 'system' | 'light' | 'dark';
export type FontSizeOption = 'small' | 'medium' | 'large';

export interface AppSettings {
  themeMode: ThemeMode;
  fontSize: FontSizeOption;
}

export interface NewsArticle {
  id: string;
  title: string;
  link: string;
  description: string;
  content?: string;
  imageUrl?: string;
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
