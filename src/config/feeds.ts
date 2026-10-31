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
  { key: 'it24hrs', label: 'IT24Hrs', url: 'https://it24hrs.com/feed/', homepage: 'https://it24hrs.com', type: 'rss' },
  { key: 'spin9', label: 'spin9', url: 'https://spin9.me/feed/', homepage: 'https://spin9.me', type: 'rss' },
  { key: 'techoffside', label: 'TechOffside', url: 'https://www.techoffside.com/feed/', homepage: 'https://www.techoffside.com', type: 'rss' },
  { key: 'thumbsup', label: 'Thumbsup', url: 'https://www.thumbsup.in.th/feed', homepage: 'https://www.thumbsup.in.th', type: 'rss' },
  { key: 'thaiware', label: 'Thaiware', url: 'https://www.thaiware.com/rss/rss_latestPost_news.php', homepage: 'https://www.thaiware.com', type: 'rss' },
  { key: 'sanook-hitech-computer', label: 'Sanook Hitech Computer', url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/hitech.computer.index.xml', homepage: 'https://hitech.sanook.com', type: 'rss' },
  { key: 'google-tech-th', label: 'Google ข่าวไอที', url: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FuUm9HZ0pVU0NnQVAB?hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
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
    key: 'thairath',
    label: 'ไทยรัฐ',
    url: 'https://www.thairath.co.th/rss/news',
    homepage: 'https://www.thairath.co.th',
    type: 'rss',
  },
  {
    key: 'thairath-business',
    label: 'ไทยรัฐ ธุรกิจ',
    url: 'https://www.thairath.co.th/rss/business',
    homepage: 'https://www.thairath.co.th/business',
    type: 'rss',
  },
  {
    key: 'thestandard',
    label: 'THE STANDARD',
    url: 'https://thestandard.co/feed/',
    homepage: 'https://thestandard.co',
    type: 'rss',
  },
  {
    key: 'thaipbs',
    label: 'Thai PBS',
    url: 'https://news.thaipbs.or.th/rss/news/home',
    homepage: 'https://www.thaipbs.or.th',
    type: 'rss',
  },
  {
    key: 'bbc-thai',
    label: 'BBC News ไทย',
    url: 'https://feeds.bbci.co.uk/thai/rss.xml',
    homepage: 'https://www.bbc.com/thai',
    type: 'rss',
  },
  {
    key: 'workpoint-today',
    label: 'TODAY',
    url: 'https://www.workpointtoday.com/feed',
    homepage: 'https://www.workpointtoday.com',
    type: 'rss',
  },
  {
    key: 'sanook-news',
    label: 'Sanook News',
    url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/news.index.xml',
    homepage: 'https://www.sanook.com/news',
    type: 'rss',
  },
  {
    key: 'the-momentum',
    label: 'The Momentum',
    url: 'https://themomentum.co/feed/',
    homepage: 'https://themomentum.co',
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
    url: 'https://www.dailynews.co.th/news/feed/',
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
  { key: 'whatphone', label: 'WhatPhone', url: 'https://whatphone.net/feed/', homepage: 'https://whatphone.net', type: 'rss' },
  { key: 'google-android', label: 'Google Android', url: 'https://news.google.com/rss/search?q=Android&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-iphone', label: 'Apple / iPhone', url: 'https://news.google.com/rss/search?q=Apple+OR+iPhone&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const computerSources: FeedSource[] = [
  { key: 'notebookspec', label: 'NotebookSPEC', url: 'https://notebookspec.com/web/feed', homepage: 'https://notebookspec.com', type: 'rss' },
  { key: 'gamingdose', label: 'GamingDose', url: 'https://www.gamingdose.com/feed/', homepage: 'https://www.gamingdose.com', type: 'rss' },
  { key: 'game-ded', label: 'Game-Ded', url: 'https://www.game-ded.com/feed', homepage: 'https://www.game-ded.com', type: 'rss' },
  { key: 'gamemonday', label: 'GameMonday', url: 'https://www.gamemonday.com/feed', homepage: 'https://www.gamemonday.com', type: 'rss' },
  { key: 'extremeit', label: 'Extreme IT', url: 'https://www.extremeit.com/feed/', homepage: 'https://www.extremeit.com', type: 'rss' },
  { key: 'google-cloud', label: 'Cloud / DC', url: 'https://news.google.com/rss/search?q=Cloud+OR+Data+Center&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const aiSources: FeedSource[] = [
  { key: 'google-ai-th', label: 'Google ข่าว AI (ไทย)', url: 'https://news.google.com/rss/search?q=AI+OR+ปัญญาประดิษฐ์&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'techcrunch-ai', label: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', homepage: 'https://techcrunch.com', type: 'rss' },
  { key: 'venturebeat-ai', label: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', homepage: 'https://venturebeat.com', type: 'rss' },
];

export const weatherSources: FeedSource[] = [
  { key: 'thairath-weather', label: 'ไทยรัฐ พยากรณ์อากาศ & ภัยพิบัติ', url: 'https://www.thairath.co.th/rss/news', homepage: 'https://www.thairath.co.th', type: 'rss' },
  { key: 'sanook-weather', label: 'Sanook เกาะติดสภาพอากาศ', url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/news.index.xml', homepage: 'https://www.sanook.com/news', type: 'rss' },
  { key: 'matichon-weather', label: 'มติชน ดินฟ้าอากาศ', url: 'https://www.matichon.co.th/feed', homepage: 'https://www.matichon.co.th', type: 'rss' },
  { key: 'khaosod-weather', label: 'ข่าวสด สภาพอากาศ & อุทกภัย', url: 'https://www.khaosod.co.th/feed', homepage: 'https://www.khaosod.co.th', type: 'rss' },
  { key: 'google-weather-th', label: 'Google ข่าวพยากรณ์อากาศ', url: 'https://news.google.com/rss/search?q=%E0%B8%9E%E0%B8%A2%E0%B8%B2%E0%B8%81%E0%B8%A3%E0%B8%93%E0%B9%8C%E0%B8%AD%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A8+OR+%E0%B8%9D%E0%B8%99%E0%B8%95%E0%B8%81&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-storm-th', label: 'ข่าวพายุ & น้ำท่วม', url: 'https://news.google.com/rss/search?q=%E0%B8%9E%E0%B8%B2%E0%B8%A2%E0%B8%B8+OR+%E0%B8%99%E0%B9%89%E0%B8%B3%E0%B8%97%E0%B9%88%E0%B8%A7%E0%B8%A1&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-pm25-th', label: 'รายงานฝุ่น PM2.5', url: 'https://news.google.com/rss/search?q=PM2.5+OR+%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%A0%E0%B8%B2%E0%B8%9E%E0%B8%AD%E0%B8%B2%E0%B8%81%E0%B8%B2%E0%B8%A8&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const cybersecuritySources: FeedSource[] = [
  { key: 'techtalkthai-cyber', label: 'TechTalkThai ไซเบอร์ซีเคียวริตี้', url: 'https://www.techtalkthai.com/tag/cybersecurity/feed/', homepage: 'https://www.techtalkthai.com', type: 'rss' },
  { key: 'thehackernews', label: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews', homepage: 'https://thehackernews.com', type: 'rss' },
  { key: 'techtalkthai-sec', label: 'TechTalkThai ความปลอดภัย', url: 'https://www.techtalkthai.com/tag/security/feed/', homepage: 'https://www.techtalkthai.com', type: 'rss' },
  { key: 'google-cyber-th', label: 'Google เตือนภัยไซเบอร์ & แก๊งคอล', url: 'https://news.google.com/rss/search?q=%E0%B9%84%E0%B8%8b%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C+OR+%E0%B9%81%E0%B8%87%E0%B8%81%E0%B9%80%E0%B8%81%E0%B8%AD%E0%B8%A3%E0%B9%8C+OR+%E0%B9%81%E0%B8%81%E0%B9%87%E0%B8%87%E0%B8%84%E0%B8%AD%E0%B8%A5%E0%B9%80%E0%B8%8b%E0%B9%87%E0%B8%99%E0%B9%80%E0%B8%85%E0%B8%AD%E0%B8%A3%E0%B9%8C+-site:facebook.com+-site:twitter.com+-site:x.com&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'google-security-th', label: 'Google ข่าวความมั่นคงปลอดภัย', url: 'https://news.google.com/rss/search?q=%E0%B8%84%E0%B8%A7%E0%B8%B2%E0%B8%A1%E0%B8%A1%E0%B8%B1%E0%B9%88%E0%B8%99%E0%B8%84%E0%B8%87%E0%B8%9B%E0%B8%A5%E0%B8%AD%E0%B8%94%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B9%84%E0%B8%8b%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C+OR+%E0%B8%A0%E0%B8%B1%E0%B8%A2%E0%B9%84%E0%B8%8b%E0%B8%9A%E0%B8%AD%E0%B8%A3%E0%B9%8C+-site:facebook.com+-site:twitter.com+-site:x.com&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const evSources: FeedSource[] = [
  { key: 'autolifethailand', label: 'Autolife Thailand', url: 'https://autolifethailand.tv/feed/', homepage: 'https://autolifethailand.tv', type: 'rss' },
  { key: 'google-ev-th', label: 'Google ข่าวรถยนต์ไฟฟ้า EV', url: 'https://news.google.com/rss/search?q=รถยนต์ไฟฟ้า+OR+EV&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'insideevs', label: 'InsideEVs', url: 'https://insideevs.com/rss/news/all/', homepage: 'https://insideevs.com', type: 'rss' },
];

export const scienceSpaceSources: FeedSource[] = [
  { key: 'google-space-th', label: 'Google ข่าวอวกาศ & ดาราศาสตร์', url: 'https://news.google.com/rss/search?q=%E0%B8%AD%E0%B8%A7%E0%B8%81%E0%B8%B2%E0%B8%A8+OR+%E0%B8%94%E0%B8%B2%E0%B8%A3%E0%B8%B2%E0%B8%A8%E0%B8%B2%E0%B8%AA%E0%B8%95%E0%B8%A3%E0%B9%8C+OR+SpaceX&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
  { key: 'space-com', label: 'Space.com', url: 'https://www.space.com/feeds/all', homepage: 'https://www.space.com', type: 'rss' },
];

export const fintechCryptoSources: FeedSource[] = [
  { key: 'bitcoinaddict', label: 'Bitcoin Addict', url: 'https://bitcoinaddict.org/feed/', homepage: 'https://bitcoinaddict.org', type: 'rss' },
  { key: 'cointelegraph', label: 'Cointelegraph', url: 'https://cointelegraph.com/rss', homepage: 'https://cointelegraph.com', type: 'rss' },
  { key: 'siamblockchain', label: 'Siam Blockchain', url: 'https://siamblockchain.com/feed/', homepage: 'https://siamblockchain.com', type: 'rss' },
];

export const developerSources: FeedSource[] = [
  { key: 'dev-to', label: 'DEV Community', url: 'https://dev.to/feed', homepage: 'https://dev.to', type: 'rss' },
  { key: 'github-blog', label: 'GitHub Blog', url: 'https://github.blog/feed/', homepage: 'https://github.blog', type: 'rss' },
  { key: 'freecodecamp', label: 'freeCodeCamp', url: 'https://www.freecodecamp.org/news/rss/', homepage: 'https://www.freecodecamp.org', type: 'rss' },
];

export const agricultureSources: FeedSource[] = [
  { key: 'doae-news', label: 'ศูนย์ข่าวกรมส่งเสริมการเกษตร', url: 'https://doaenews.doae.go.th/feed', homepage: 'https://doaenews.doae.go.th', type: 'rss' },
  { key: 'google-agri-th', label: 'Google ข่าวเกษตร', url: 'https://news.google.com/rss/search?q=เกษตร+OR+พืชสวน+OR+ปศุสัตว์&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const educationSources: FeedSource[] = [
  { key: 'google-edu-th', label: 'Google ข่าวการศึกษา', url: 'https://news.google.com/rss/search?q=การศึกษา+OR+ทุนการศึกษา+OR+TCAS&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const economySources: FeedSource[] = [
  { key: 'thestandard-wealth', label: 'THE STANDARD WEALTH', url: 'https://thestandard.co/category/wealth/feed/', homepage: 'https://thestandard.co/category/wealth/', type: 'rss' },
  { key: 'brandinside-biz', label: 'Brand Inside ธุรกิจ & การเงิน', url: 'https://brandinside.asia/feed/', homepage: 'https://brandinside.asia', type: 'rss' },
  { key: 'marketingoops-biz', label: 'Marketing Oops การตลาด & ธุรกิจ', url: 'https://www.marketingoops.com/feed/', homepage: 'https://www.marketingoops.com', type: 'rss' },
  { key: 'kaohoon-biz', label: 'ข่าวหุ้นธุรกิจออนไลน์', url: 'https://www.kaohoon.com/feed', homepage: 'https://www.kaohoon.com', type: 'rss' },
  { key: 'google-economy-th', label: 'Google ข่าวเศรษฐกิจ', url: 'https://news.google.com/rss/search?q=เศรษฐกิจ+OR+หุ้นไทย+OR+การเงิน&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const healthMedicalSources: FeedSource[] = [
  { key: 'google-health-th', label: 'Google สุขภาพและการแพทย์', url: 'https://news.google.com/rss/search?q=สุขภาพ+OR+การแพทย์+OR+โรงพยาบาล&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const jobsCareersSources: FeedSource[] = [
  { key: 'google-jobs-th', label: 'Google ข่าวสมัครงาน & อาชีพ', url: 'https://news.google.com/rss/search?q=รับสมัครงาน+OR+หางาน+OR+ตำแหน่งงาน&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const sportsSources: FeedSource[] = [
  { key: 'matichon-sport', label: 'มติชน — กีฬา', url: 'https://www.matichon.co.th/sport/feed', homepage: 'https://www.matichon.co.th/sport', type: 'rss' },
  { key: 'thairath-sport', label: 'ไทยรัฐ กีฬา', url: 'https://www.thairath.co.th/rss/sport', homepage: 'https://www.thairath.co.th/sport', type: 'rss' },
  { key: 'google-sport-th', label: 'Google ข่าวกีฬา', url: 'https://news.google.com/rss/search?q=ฟุตบอล+OR+กีฬาไทย+OR+พรีเมียร์ลีก&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const travelSources: FeedSource[] = [
  { key: 'matichon-travel', label: 'มติชน — อาหารและท่องเที่ยว', url: 'https://www.matichon.co.th/lifestyle/food-travel/feed', homepage: 'https://www.matichon.co.th', type: 'rss' },
  { key: 'google-travel-th', label: 'Google ข่าวท่องเที่ยว', url: 'https://news.google.com/rss/search?q=ที่เที่ยว+OR+ท่องเที่ยวไทย+OR+การท่องเที่ยวแห่งประเทศไทย&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const entertainmentSources: FeedSource[] = [
  { key: 'matichon-ent', label: 'มติชน — บันเทิง', url: 'https://www.matichon.co.th/entertainment/feed', homepage: 'https://www.matichon.co.th/entertainment', type: 'rss' },
  { key: 'google-ent-th', label: 'Google ข่าวบันเทิง', url: 'https://news.google.com/rss/search?q=ดารา+OR+ละคร+OR+ซีรีส์&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const environmentEnergySources: FeedSource[] = [
  { key: 'google-env-th', label: 'Google สิ่งแวดล้อมและพลังงาน', url: 'https://news.google.com/rss/search?q=พลังงานสะอาด+OR+โลกร้อน+OR+สิ่งแวดล้อม&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const politicsSources: FeedSource[] = [
  { key: 'matichon-politics', label: 'มติชน — การเมือง', url: 'https://www.matichon.co.th/politics/feed', homepage: 'https://www.matichon.co.th/politics', type: 'rss' },
  { key: 'google-politics-th', label: 'Google ข่าวการเมือง', url: 'https://news.google.com/rss/search?q=การเมืองไทย+OR+รัฐสภา+OR+รัฐบาล&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const realEstateSources: FeedSource[] = [
  { key: 'prachachat-property', label: 'ประชาชาติธุรกิจ — อสังหาริมทรัพย์', url: 'https://www.prachachat.net/category/property/feed', homepage: 'https://www.prachachat.net', type: 'rss' },
  { key: 'google-property-th', label: 'Google ข่าวอสังหาริมทรัพย์', url: 'https://news.google.com/rss/search?q=อสังหาริมทรัพย์+OR+คอนโด+OR+บ้านจัดสรร&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const transportSources: FeedSource[] = [
  { key: 'google-transport-th', label: 'Google คมนาคมและขนส่ง', url: 'https://news.google.com/rss/search?q=รถไฟฟ้า+OR+ทางด่วน+OR+คมนาคม&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss' },
];

export const hotNewsSources: FeedSource[] = [
  { key: 'sanook-news', label: 'Sanook News', url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/news.index.xml', homepage: 'https://www.sanook.com/news', type: 'rss' },
  { key: 'kapook-news', label: 'Kapook ข่าวฮิต', url: 'https://rss.kapook.com/rss.xml', homepage: 'https://www.kapook.com', type: 'rss' },
  { key: 'ejan-news', label: 'อีจัน', url: 'https://www.ejan.co/rss', homepage: 'https://www.ejan.co', type: 'rss' },
  { key: 'the-momentum', label: 'The Momentum', url: 'https://themomentum.co/feed/', homepage: 'https://themomentum.co', type: 'rss' },
];


