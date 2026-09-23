export type SourceType = 'rss' | 'atom' | 'html' | 'aggregate';

export type FeedSource = {
  key: string;
  label: string;
  url: string;
  homepage: string;
  type: SourceType;
};

export const techBusinessSources: FeedSource[] = [
  { key: 'blognone', label: 'Blognone', url: 'https://www.blognone.com/atom.xml', homepage: 'https://www.blognone.com', type: 'atom' },
  { key: 'brandinside', label: 'Brand Inside', url: 'https://brandinside.asia/feed/', homepage: 'https://brandinside.asia', type: 'rss' },
  { key: 'marketingoops', label: 'Marketing Oops', url: 'https://www.marketingoops.com/feed/', homepage: 'https://www.marketingoops.com', type: 'rss' },
  { key: 'adpt-news', label: 'ADPT News', url: 'https://www.adpt.news/feed/', homepage: 'https://www.adpt.news', type: 'rss' },
  { key: 'borntodev', label: 'Born to Dev', url: 'https://www.borntodev.com/feed/', homepage: 'https://www.borntodev.com', type: 'rss' },
  { key: 'techsauce', label: 'Techsauce', url: 'https://techsauce.co/feed', homepage: 'https://techsauce.co', type: 'rss' },
  { key: 'beartai', label: 'Beartai', url: 'https://www.beartai.com/feed/', homepage: 'https://www.beartai.com', type: 'rss' },
  { key: 'techtalkthai', label: 'TechTalkThai', url: 'https://www.techtalkthai.com/feed/', homepage: 'https://www.techtalkthai.com', type: 'rss' },
  { key: 'techhub', label: 'Techhub', url: 'https://www.techhub.in.th/feed/', homepage: 'https://www.techhub.in.th', type: 'rss' },
  { key: 'thaiware', label: 'Thaiware', url: 'https://www.thaiware.com/rss/rss_latestPost_news.php', homepage: 'https://www.thaiware.com', type: 'rss' },
  { key: 'sanook-hitech-computer', label: 'Sanook Hitech Computer', url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/hitech.computer.index.xml', homepage: 'https://hitech.sanook.com', type: 'rss' },
];

export const techInternationalSources: FeedSource[] = [
  { key: 'techcrunch', label: 'TechCrunch', url: 'https://techcrunch.com/feed/', homepage: 'https://techcrunch.com', type: 'rss' },
  { key: 'the-verge', label: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', homepage: 'https://www.theverge.com', type: 'rss' },
  { key: 'ars-technica', label: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', homepage: 'https://arstechnica.com', type: 'rss' },
  { key: 'wired', label: 'WIRED', url: 'https://www.wired.com/feed/rss', homepage: 'https://www.wired.com', type: 'rss' },
  { key: 'engadget', label: 'Engadget', url: 'https://www.engadget.com/rss.xml', homepage: 'https://www.engadget.com', type: 'rss' },
  { key: 'mit-technology-review', label: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', homepage: 'https://www.technologyreview.com', type: 'rss' },
  { key: '9to5mac', label: '9to5Mac', url: 'https://9to5mac.com/feed/', homepage: 'https://9to5mac.com', type: 'rss' },
  { key: '9to5google', label: '9to5Google', url: 'https://9to5google.com/feed/', homepage: 'https://9to5google.com', type: 'rss' },
  { key: 'android-authority', label: 'Android Authority', url: 'https://www.androidauthority.com/feed/', homepage: 'https://www.androidauthority.com', type: 'rss' },
  { key: 'android-police', label: 'Android Police', url: 'https://www.androidpolice.com/feed/', homepage: 'https://www.androidpolice.com', type: 'rss' },
  { key: 'macrumors', label: 'MacRumors', url: 'https://feeds.macrumors.com/MacRumors-All', homepage: 'https://www.macrumors.com', type: 'rss' },
  { key: 'tom-hardware', label: 'Tom’s Hardware', url: 'https://www.tomshardware.com/feeds/all', homepage: 'https://www.tomshardware.com', type: 'rss' },
  { key: 'pcmag', label: 'PCMag', url: 'https://www.pcmag.com/feeds', homepage: 'https://www.pcmag.com', type: 'rss' },
  { key: 'zdnet', label: 'ZDNET', url: 'https://www.zdnet.com/news/rss.xml', homepage: 'https://www.zdnet.com', type: 'rss' },
  { key: 'venturebeat', label: 'VentureBeat', url: 'https://venturebeat.com/feed/', homepage: 'https://venturebeat.com', type: 'rss' },
  { key: 'techradar', label: 'TechRadar', url: 'https://www.techradar.com/rss', homepage: 'https://www.techradar.com', type: 'rss' },
];
export default techInternationalSources;

export const thaiNewsSources: FeedSource[] = [
  // =========================
  // 🇹🇭 สำนักข่าว / หนังสือพิมพ์
  // =========================
  {
    key: 'thaipbs',
    label: 'Thai PBS',
    url: 'https://news.thaipbs.or.th/rss/news/home',
    homepage: 'https://www.thaipbs.or.th',
    type: 'rss',
  },
  {
    key: 'nation',
    label: 'Nation TV',
    url: 'https://www.nationtv.tv/main/rss',
    homepage: 'https://www.nationtv.tv',
    type: 'rss',
  },
  {
    key: 'matichon',
    label: 'Matichon',
    url: 'https://www.matichon.co.th/feed',
    homepage: 'https://www.matichon.co.th',
    type: 'rss',
  },
  {
    key: 'dailynews',
    label: 'DailyNews',
    url: 'https://www.dailynews.co.th/feed',
    homepage: 'https://www.dailynews.co.th',
    type: 'rss',
  },
  {
    key: 'khaosod',
    label: 'Khaosod',
    url: 'https://www.khaosod.co.th/feed',
    homepage: 'https://www.khaosod.co.th',
    type: 'rss',
  },
  {
    key: 'mgronline',
    label: 'MGR Online',
    url: 'https://mgronline.com/store/rss/index.xml',
    homepage: 'https://mgronline.com',
    type: 'rss',
  },

  // =========================
  // 🏦 ข่าวเศรษฐกิจ / ธุรกิจ
  // =========================
  {
    key: 'prachachat',
    label: 'Prachachat',
    url: 'https://www.prachachat.net/feed',
    homepage: 'https://www.prachachat.net',
    type: 'rss',
  },
];

export const mobileSources: FeedSource[] = [
  { key: 'specphone', label: 'Specphone', url: 'https://specphone.com/web/feed', homepage: 'https://specphone.com', type: 'rss' },
  { key: 'appdisqus', label: 'AppDisqus', url: 'https://www.appdisqus.com/feed/', homepage: 'https://www.appdisqus.com', type: 'rss' },
  { key: 'flashfly', label: 'Flashfly', url: 'https://www.flashfly.net/wp/feed', homepage: 'https://www.flashfly.net', type: 'rss' },
  { key: 'iphone-mod', label: 'iMoD', url: 'https://www.iphonemod.net/feed', homepage: 'https://www.iphonemod.net', type: 'rss' },
  { key: 'droidsans', label: 'DroidSans', url: 'https://droidsans.com/feed/', homepage: 'https://droidsans.com', type: 'rss' },
  { key: 'google-android', label: 'Google Android', url: 'https://news.google.com/rss/search?q=Android&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-iphone', label: 'Apple / iPhone', url: 'https://news.google.com/rss/search?q=Apple+OR+iPhone&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const computerSources: FeedSource[] = [
  { key: 'notebookspec', label: 'NotebookSPEC', url: 'https://notebookspec.com/web/feed', homepage: 'https://notebookspec.com', type: 'rss' },
  { key: 'gamingdose', label: 'GamingDose', url: 'https://www.gamingdose.com/feed/', homepage: 'https://www.gamingdose.com', type: 'rss' },
  { key: 'extremeit', label: 'Extreme IT', url: 'https://www.extremeit.com/feed/', homepage: 'https://www.extremeit.com', type: 'rss' },
  { key: 'google-cloud', label: 'Cloud / DC', url: 'https://news.google.com/rss/search?q=Cloud+OR+Data+Center&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];
