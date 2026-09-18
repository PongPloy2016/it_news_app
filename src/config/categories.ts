import {
  computerSources,
  FeedSource,
  mobileSources,
  techBusinessSources,
  techInternationalSources,
  thaiNewsSources,
} from './feeds';

export type FeedGroup = {
  key: string;
  label: string;
  color: string;
  sources: FeedSource[];
};

export const FEED_GROUPS: FeedGroup[] = [
  { key: 'tech-business', label: 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล', color: '#2F6FED', sources: techBusinessSources },
  { key: 'international', label: 'ข่าวไอทีต่างประเทศ', color: '#0284C7', sources: techInternationalSources },
  { key: 'thai-news', label: 'ข่าวสำนักข่าวไทย', color: '#D946EF', sources: thaiNewsSources },
  { key: 'mobile', label: 'ข่าวมือถือและอุปกรณ์', color: '#17A673', sources: mobileSources },
  { key: 'computer-games', label: 'ข่าวคอมพิวเตอร์และเกม', color: '#F59E0B', sources: computerSources },
];

export const FEED_SOURCES: FeedSource[] = FEED_GROUPS.flatMap((group) => group.sources);

export const DEFAULT_FEED_KEY = FEED_SOURCES[0].key;
export const DEFAULT_FEED_URL = FEED_SOURCES[0].url;
