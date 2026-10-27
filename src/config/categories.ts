import {
  aiSources,
  computerSources,
  cybersecuritySources,
  developerSources,
  economySources,
  educationSources,
  entertainmentSources,
  environmentEnergySources,
  evSources,
  FeedSource,
  fintechCryptoSources,
  healthMedicalSources,
  hotNewsSources,
  jobsCareersSources,
  mobileSources,
  politicsSources,
  realEstateSources,
  scienceSpaceSources,
  sportsSources,
  techBusinessSources,
  techInternationalSources,
  thaiNewsSources,
  transportSources,
  travelSources,
  weatherSources,
  agricultureSources,
} from './feeds';

export type FeedGroup = {
  key: string;
  label: string;
  label_en?: string;
  color: string;
  sources: FeedSource[];
  is_active?: boolean;
  order_index?: number;
};

export const createAggregateSource = (groupKey: string, groupLabel: string): FeedSource => ({
  key: `all:${groupKey}`,
  label: 'ทั้งหมด (All)',
  url: `aggregate://${groupKey}`,
  homepage: 'https://techthainews.app',
  type: 'aggregate',
});

/**
 * Complete list of 25 categories strictly conforming to the official specification:
 * Order, Thai Label, Slug (key), Color, Active Status
 */
export const ALL_FEED_GROUPS: FeedGroup[] = [
  // #1
  {
    key: 'tech-business',
    label: 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล',
    label_en: 'Tech & Digital Business',
    color: '#2F6FED',
    is_active: true,
    order_index: 1,
    sources: [
      createAggregateSource('tech-business', 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล'),
      ...techBusinessSources,
    ],
  },
  // #2
  {
    key: 'international',
    label: 'ข่าวไอทีต่างประเทศ',
    label_en: 'Global Tech News',
    color: '#0284C7',
    is_active: true,
    order_index: 2,
    sources: [
      createAggregateSource('international', 'ข่าวไอทีต่างประเทศ'),
      ...techInternationalSources,
    ],
  },
  // #3
  {
    key: 'thai-news',
    label: 'ข่าวสำนักข่าวไทย',
    label_en: 'Thai News Agencies',
    color: '#D946EF',
    is_active: true,
    order_index: 3,
    sources: [
      createAggregateSource('thai-news', 'ข่าวสำนักข่าวไทย'),
      ...thaiNewsSources,
    ],
  },
  // #4
  {
    key: 'mobile',
    label: 'ข่าวมือถือและอุปกรณ์',
    label_en: 'Mobile & Gadgets',
    color: '#17A673',
    is_active: false,
    order_index: 4,
    sources: [
      createAggregateSource('mobile', 'ข่าวมือถือและอุปกรณ์'),
      ...mobileSources,
    ],
  },
  // #5
  {
    key: 'computer-games',
    label: 'ข่าวคอมพิวเตอร์และเกม',
    label_en: 'Computer & Gaming',
    color: '#F59E0B',
    is_active: false,
    order_index: 5,
    sources: [
      createAggregateSource('computer-games', 'ข่าวคอมพิวเตอร์และเกม'),
      ...computerSources,
    ],
  },
  // #6
  {
    key: 'ai-innovation',
    label: 'ปัญญาประดิษฐ์และ AI',
    label_en: 'AI & Innovation',
    color: '#8B5CF6',
    is_active: false,
    order_index: 6,
    sources: [
      createAggregateSource('ai-innovation', 'ปัญญาประดิษฐ์และ AI'),
      ...aiSources,
    ],
  },
  // #7
  {
    key: 'weather-forecast',
    label: 'สภาพอากาศและฟ้าฝน',
    label_en: 'Weather & Forecast',
    color: '#0284C7',
    is_active: true,
    order_index: 7,
    sources: [
      createAggregateSource('weather-forecast', 'สภาพอากาศและฟ้าฝน'),
      ...weatherSources,
    ],
  },
  // #8
  {
    key: 'cybersecurity',
    label: 'ความปลอดภัยไซเบอร์และเตือนภัย',
    label_en: 'Cybersecurity & Alerts',
    color: '#EF4444',
    is_active: true,
    order_index: 8,
    sources: [
      createAggregateSource('cybersecurity', 'ความปลอดภัยไซเบอร์และเตือนภัย'),
      ...cybersecuritySources,
    ],
  },
  // #9
  {
    key: 'ev-vehicles',
    label: 'ยานยนต์ไฟฟ้าและเทคโนโลยี EV',
    label_en: 'EV & Automotive Tech',
    color: '#10B981',
    is_active: false,
    order_index: 9,
    sources: [
      createAggregateSource('ev-vehicles', 'ยานยนต์ไฟฟ้าและเทคโนโลยี EV'),
      ...evSources,
    ],
  },
  // #10
  {
    key: 'science-space',
    label: 'วิทยาศาสตร์และสำรวจอวกาศ',
    label_en: 'Science & Space',
    color: '#6366F1',
    is_active: false,
    order_index: 10,
    sources: [
      createAggregateSource('science-space', 'วิทยาศาสตร์และสำรวจอวกาศ'),
      ...scienceSpaceSources,
    ],
  },
  // #11
  {
    key: 'fintech-crypto',
    label: 'การเงินดิจิทัลและบล็อกเชน',
    label_en: 'Fintech & Blockchain',
    color: '#F59E0B',
    is_active: false,
    order_index: 11,
    sources: [
      createAggregateSource('fintech-crypto', 'การเงินดิจิทัลและบล็อกเชน'),
      ...fintechCryptoSources,
    ],
  },
  // #12
  {
    key: 'developer-coding',
    label: 'โปรแกรมมิ่งและนักพัฒนา',
    label_en: 'Programming & Developers',
    color: '#06B6D4',
    is_active: false,
    order_index: 12,
    sources: [
      createAggregateSource('developer-coding', 'โปรแกรมมิ่งและนักพัฒนา'),
      ...developerSources,
    ],
  },
  // #13
  {
    key: 'agriculture',
    label: 'ข่าวเกษตร',
    label_en: 'Agriculture News',
    color: '#16a34a',
    is_active: true,
    order_index: 13,
    sources: [
      createAggregateSource('agriculture', 'ข่าวเกษตร'),
      ...agricultureSources,
    ],
  },
  // #14
  {
    key: 'education',
    label: 'ข่าวการศึกษา',
    label_en: 'Education News',
    color: '#7c3aed',
    is_active: false,
    order_index: 14,
    sources: [
      createAggregateSource('education', 'ข่าวการศึกษา'),
      ...educationSources,
    ],
  },
  // #15
  {
    key: 'economy-business',
    label: 'ข่าวเศรษฐกิจ ธุรกิจ การตลาด',
    label_en: 'Economy & Business',
    color: '#d97706',
    is_active: true,
    order_index: 15,
    sources: [
      createAggregateSource('economy-business', 'ข่าวเศรษฐกิจ ธุรกิจ การตลาด'),
      ...economySources,
    ],
  },
  // #16
  {
    key: 'health-medical',
    label: 'ข่าวสุขภาพและการแพทย์',
    label_en: 'Health & Medicine',
    color: '#e11d48',
    is_active: false,
    order_index: 16,
    sources: [
      createAggregateSource('health-medical', 'ข่าวสุขภาพและการแพทย์'),
      ...healthMedicalSources,
    ],
  },
  // #17
  {
    key: 'jobs-careers',
    label: 'ข่าวงานและสมัครงาน',
    label_en: 'Jobs & Careers',
    color: '#0891b2',
    is_active: false,
    order_index: 17,
    sources: [
      createAggregateSource('jobs-careers', 'ข่าวงานและสมัครงาน'),
      ...jobsCareersSources,
    ],
  },
  // #18
  {
    key: 'sports',
    label: 'ข่าวกีฬา',
    label_en: 'Sports News',
    color: '#ea580c',
    is_active: true,
    order_index: 18,
    sources: [
      createAggregateSource('sports', 'ข่าวกีฬา'),
      ...sportsSources,
    ],
  },
  // #19
  {
    key: 'travel-tourism',
    label: 'ข่าวท่องเที่ยว',
    label_en: 'Travel & Tourism',
    color: '#0d9488',
    is_active: true,
    order_index: 19,
    sources: [
      createAggregateSource('travel-tourism', 'ข่าวท่องเที่ยว'),
      ...travelSources,
    ],
  },
  // #20
  {
    key: 'entertainment',
    label: 'ข่าวบันเทิง',
    label_en: 'Entertainment News',
    color: '#db2777',
    is_active: false,
    order_index: 20,
    sources: [
      createAggregateSource('entertainment', 'ข่าวบันเทิง'),
      ...entertainmentSources,
    ],
  },
  // #21
  {
    key: 'environment-energy',
    label: 'ข่าวสิ่งแวดล้อมและพลังงาน',
    label_en: 'Environment & Energy',
    color: '#65a30d',
    is_active: false,
    order_index: 21,
    sources: [
      createAggregateSource('environment-energy', 'ข่าวสิ่งแวดล้อมและพลังงาน'),
      ...environmentEnergySources,
    ],
  },
  // #22
  {
    key: 'politics',
    label: 'ข่าวการเมือง',
    label_en: 'Politics News',
    color: '#dc2626',
    is_active: false,
    order_index: 22,
    sources: [
      createAggregateSource('politics', 'ข่าวการเมือง'),
      ...politicsSources,
    ],
  },
  // #23
  {
    key: 'real-estate',
    label: 'ข่าวอสังหาริมทรัพย์',
    label_en: 'Real Estate News',
    color: '#9333ea',
    is_active: false,
    order_index: 23,
    sources: [
      createAggregateSource('real-estate', 'ข่าวอสังหาริมทรัพย์'),
      ...realEstateSources,
    ],
  },
  // #24
  {
    key: 'transport',
    label: 'ข่าวคมนาคมและขนส่ง',
    label_en: 'Transport & Logistics',
    color: '#2563eb',
    is_active: false,
    order_index: 24,
    sources: [
      createAggregateSource('transport', 'ข่าวคมนาคมและขนส่ง'),
      ...transportSources,
    ],
  },
  // #25
  {
    key: 'hot',
    label: 'ข่าวทั่วไป',
    label_en: 'General News',
    color: '#ed6031',
    is_active: true,
    order_index: 25,
    sources: [
      createAggregateSource('hot', 'ข่าวทั่วไป'),
      ...hotNewsSources,
    ],
  },
];

export const FEED_GROUPS: FeedGroup[] = ALL_FEED_GROUPS.filter((g) => g.is_active !== false);

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
