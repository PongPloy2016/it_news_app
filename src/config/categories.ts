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

export const createAggregateSource = (groupKey: string, groupLabel: string): FeedSource => ({
  key: `all:${groupKey}`,
  label: 'ทั้งหมด (All)',
  url: `aggregate://${groupKey}`,
  homepage: 'https://techthainews.app',
  type: 'aggregate',
});

export const FEED_GROUPS: FeedGroup[] = [
  {
    key: 'tech-business',
    label: 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล',
    color: '#2F6FED',
    sources: [
      createAggregateSource('tech-business', 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล'),
      ...techBusinessSources,
    ],
  },
  {
    key: 'international',
    label: 'ข่าวไอทีต่างประเทศ',
    color: '#0284C7',
    sources: [
      createAggregateSource('international', 'ข่าวไอทีต่างประเทศ'),
      ...techInternationalSources,
    ],
  },
  {
    key: 'thai-news',
    label: 'ข่าวสำนักข่าวไทย',
    color: '#D946EF',
    sources: [
      createAggregateSource('thai-news', 'ข่าวสำนักข่าวไทย'),
      ...thaiNewsSources,
    ],
  },
  {
    key: 'mobile',
    label: 'ข่าวมือถือและอุปกรณ์',
    color: '#17A673',
    sources: [
      createAggregateSource('mobile', 'ข่าวมือถือและอุปกรณ์'),
      ...mobileSources,
    ],
  },
  {
    key: 'computer-games',
    label: 'ข่าวคอมพิวเตอร์และเกม',
    color: '#F59E0B',
    sources: [
      createAggregateSource('computer-games', 'ข่าวคอมพิวเตอร์และเกม'),
      ...computerSources,
    ],
  },
];

export const FEED_SOURCES: FeedSource[] = (() => {
  const seen = new Set<string>();
  const list: FeedSource[] = [];
  for (const group of FEED_GROUPS) {
    for (const s of group.sources) {
      if (!seen.has(s.key)) {
        seen.add(s.key);
        list.push(s);
      }
    }
  }
  return list;
})();

export const DEFAULT_FEED_KEY = 'blognone';
export const DEFAULT_FEED_URL = 'https://www.blognone.com/atom.xml';
