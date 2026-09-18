type SourceType = 'rss' | 'atom' | 'html';

export type FeedSource = {
  key: string;
  label: string;
  url: string;
  homepage: string;
  type: SourceType;
};

export type FeedGroup = {
  key: string;
  label: string;
  color: string;
  sources: FeedSource[];
};

const techBusinessSources: FeedSource[] = [
  { key: 'brandinside', label: 'Brand Inside', url: 'https://brandinside.asia/feed/', homepage: 'https://brandinside.asia', type: 'rss' },
  { key: 'marketingoops', label: 'Marketing Oops', url: 'https://www.marketingoops.com/feed/', homepage: 'https://www.marketingoops.com', type: 'rss' },
  { key: 'adpt-news', label: 'ADPT News', url: 'https://www.adpt.news/feed/', homepage: 'https://www.adpt.news', type: 'rss' },
  { key: 'borntodev', label: 'Born to Dev', url: 'https://www.borntodev.com/feed/', homepage: 'https://www.borntodev.com', type: 'rss' },
  { key: 'blognone', label: 'Blognone', url: 'https://www.blognone.com/atom.xml', homepage: 'https://www.blognone.com', type: 'atom' },
  { key: 'techsauce', label: 'Techsauce', url: 'https://techsauce.co/feed', homepage: 'https://techsauce.co', type: 'rss' },
  { key: 'beartai', label: 'Beartai', url: 'https://www.beartai.com/feed/', homepage: 'https://www.beartai.com', type: 'rss' },
  { key: 'techtalkthai', label: 'TechTalkThai', url: 'https://www.techtalkthai.com/feed/', homepage: 'https://www.techtalkthai.com', type: 'rss' },
  { key: 'google-tech', label: 'Google Tech', url: 'https://news.google.com/rss/search?q=เทคโนโลยี&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-ai', label: 'Google AI', url: 'https://news.google.com/rss/search?q=AI+OR+ปัญญาประดิษฐ์&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-cyber', label: 'Google Cyber', url: 'https://news.google.com/rss/search?q=Cybersecurity+OR+ความปลอดภัยไซเบอร์&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

const thaiNewsSources: FeedSource[] = [
  {
    key: 'bangkokbiz',
    label: 'Bangkok Biz',
    url: 'https://www.bangkokbiznews.com/tech',
    homepage: 'https://www.bangkokbiznews.com/tech',
    type: 'html',
  },
  {
    key: 'thaieconomy',
    label: 'ฐานเศรษฐกิจ',
    url: 'https://www.thansettakij.com/technology',
    homepage: 'https://www.thansettakij.com/technology',
    type: 'html',
  },
  {
    key: 'tnn-th',
    label: 'TNN Thailand',
    url: 'https://www.tnnthailand.com/tech/',
    homepage: 'https://www.tnnthailand.com/tech/',
    type: 'html',
  },
  {
    key: 'nation-th',
    label: 'Nation Thailand',
    url: 'https://www.nationthailand.com/business/tech',
    homepage: 'https://www.nationthailand.com/business/tech',
    type: 'html',
  },
  {
    key: 'pptv-th',
    label: 'PPTV HD 36',
    url: 'https://www.pptvhd36.com/news/%E0%B9%84%E0%B8%AD%E0%B8%97%E0%B8%B5',
    homepage: 'https://www.pptvhd36.com/news/%E0%B9%84%E0%B8%AD%E0%B8%97%E0%B8%B5',
    type: 'html',
  },
  {
    key: 'thairath',
    label: 'ไทยรัฐ',
    url: 'https://www.thairath.co.th/lifestyle/tech',
    homepage: 'https://www.thairath.co.th/lifestyle/tech',
    type: 'html',
  },
  {
    key: 'sanook-hitech',
    label: 'Sanook Hitech',
    url: 'https://www.sanook.com/hitech/',
    homepage: 'https://www.sanook.com/hitech/',
    type: 'html',
  },
  {
    key: 'spring-news',
    label: 'Spring News',
    url: 'https://www.springnews.co.th/digital-tech',
    homepage: 'https://www.springnews.co.th/digital-tech',
    type: 'html',
  },
  {
    key: 'manager-online',
    label: 'ผู้จัดการออนไลน์',
    url: 'https://mgronline.com/cyberbiz',
    homepage: 'https://mgronline.com/cyberbiz',
    type: 'html',
  },
];

const mobileSources: FeedSource[] = [
  { key: 'specphone', label: 'Specphone', url: 'https://specphone.com/web/feed', homepage: 'https://specphone.com', type: 'rss' },
  { key: 'appdisqus', label: 'AppDisqus', url: 'https://www.appdisqus.com/feed/', homepage: 'https://www.appdisqus.com', type: 'rss' },
  { key: 'flashfly', label: 'Flashfly', url: 'https://www.flashfly.net/wp/feed', homepage: 'https://www.flashfly.net', type: 'rss' },
  { key: 'iphone-mod', label: 'iMoD', url: 'https://www.iphonemod.net/feed', homepage: 'https://www.iphonemod.net', type: 'rss' },
  { key: 'droidsans', label: 'DroidSans', url: 'https://droidsans.com/feed/', homepage: 'https://droidsans.com', type: 'rss' },
  { key: 'google-android', label: 'Google Android', url: 'https://news.google.com/rss/search?q=Android&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-iphone', label: 'Apple / iPhone', url: 'https://news.google.com/rss/search?q=Apple+OR+iPhone&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

const computerSources: FeedSource[] = [
  { key: 'notebookspec', label: 'NotebookSPEC', url: 'https://notebookspec.com/web/feed', homepage: 'https://notebookspec.com', type: 'rss' },
  { key: 'gamingdose', label: 'GamingDose', url: 'https://www.gamingdose.com/feed/', homepage: 'https://www.gamingdose.com', type: 'rss' },
  { key: 'extremeit', label: 'Extreme IT', url: 'https://www.extremeit.com/feed/', homepage: 'https://www.extremeit.com', type: 'rss' },
  { key: 'google-cloud', label: 'Cloud / DC', url: 'https://news.google.com/rss/search?q=Cloud+OR+Data+Center&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const FEED_GROUPS: FeedGroup[] = [
  { key: 'tech-business', label: 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล', color: '#2F6FED', sources: techBusinessSources },
  { key: 'thai-news', label: 'ข่าวสำนักข่าวไทย', color: '#D946EF', sources: thaiNewsSources },
  { key: 'mobile', label: 'ข่าวมือถือและอุปกรณ์', color: '#17A673', sources: mobileSources },
  { key: 'computer-games', label: 'ข่าวคอมพิวเตอร์และเกม', color: '#F59E0B', sources: computerSources },
];

export const FEED_SOURCES: FeedSource[] = FEED_GROUPS.flatMap((group) => group.sources);

export const DEFAULT_FEED_KEY = FEED_SOURCES[0].key;
export const FEED_URL = process.env.EXPO_PUBLIC_RSS_FEED_URL || FEED_SOURCES[0].url;

export const PROXY_URL = process.env.EXPO_PUBLIC_RSS_PROXY_URL || '';
export const BLOGNONE_HOME = FEED_SOURCES[0].homepage || 'https://www.blognone.com';
