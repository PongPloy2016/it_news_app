/**
 * Seed or update feed sources in Supabase
 * Usage: node scripts/seed-supabase.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env file if present
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...values] = trimmed.split('=');
      const val = values.join('=').trim();
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://zpigezwdsjelwvdpyahb.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_KEY) {
  console.error('Error: SUPABASE_SECRET_KEY or SUPABASE_PUBLISHABLE_KEY is not set in environment or .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const FEED_GROUPS = [
  { key: 'tech-business', label: 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล', color: '#2F6FED', order_index: 1 },
  { key: 'international', label: 'ข่าวไอทีต่างประเทศ', color: '#0284C7', order_index: 2 },
  { key: 'thai-news', label: 'ข่าวสำนักข่าวไทย', color: '#D946EF', order_index: 3 },
  { key: 'mobile', label: 'ข่าวมือถือและอุปกรณ์', color: '#17A673', order_index: 4 },
  { key: 'computer-games', label: 'ข่าวคอมพิวเตอร์และเกม', color: '#F59E0B', order_index: 5 },
];

const FEED_SOURCES = [
  // Tech & Business
  { key: 'blognone', label: 'Blognone', url: 'https://www.blognone.com/atom.xml', homepage: 'https://www.blognone.com', type: 'atom', group_key: 'tech-business', order_index: 1 },
  { key: 'brandinside', label: 'Brand Inside', url: 'https://brandinside.asia/feed/', homepage: 'https://brandinside.asia', type: 'rss', group_key: 'tech-business', order_index: 2 },
  { key: 'marketingoops', label: 'Marketing Oops', url: 'https://www.marketingoops.com/feed/', homepage: 'https://www.marketingoops.com', type: 'rss', group_key: 'tech-business', order_index: 3 },
  { key: 'adpt-news', label: 'ADPT News', url: 'https://www.adpt.news/feed/', homepage: 'https://www.adpt.news', type: 'rss', group_key: 'tech-business', order_index: 4 },
  { key: 'borntodev', label: 'Born to Dev', url: 'https://www.borntodev.com/feed/', homepage: 'https://www.borntodev.com', type: 'rss', group_key: 'tech-business', order_index: 5 },
  { key: 'techsauce', label: 'Techsauce', url: 'https://techsauce.co/feed', homepage: 'https://techsauce.co', type: 'rss', group_key: 'tech-business', order_index: 6 },
  { key: 'beartai', label: 'Beartai', url: 'https://www.beartai.com/feed/', homepage: 'https://www.beartai.com', type: 'rss', group_key: 'tech-business', order_index: 7 },
  { key: 'techtalkthai', label: 'TechTalkThai', url: 'https://www.techtalkthai.com/feed/', homepage: 'https://www.techtalkthai.com', type: 'rss', group_key: 'tech-business', order_index: 8 },
  { key: 'techhub', label: 'Techhub', url: 'https://www.techhub.in.th/feed/', homepage: 'https://www.techhub.in.th', type: 'rss', group_key: 'tech-business', order_index: 9 },
  { key: 'it24hrs', label: 'IT24Hrs', url: 'https://it24hrs.com/feed/', homepage: 'https://it24hrs.com', type: 'rss', group_key: 'tech-business', order_index: 10 },
  { key: 'spin9', label: 'spin9', url: 'https://spin9.me/feed/', homepage: 'https://spin9.me', type: 'rss', group_key: 'tech-business', order_index: 11 },
  { key: 'techoffside', label: 'TechOffside', url: 'https://www.techoffside.com/feed/', homepage: 'https://www.techoffside.com', type: 'rss', group_key: 'tech-business', order_index: 12 },
  { key: 'thumbsup', label: 'Thumbsup', url: 'https://www.thumbsup.in.th/feed', homepage: 'https://www.thumbsup.in.th', type: 'rss', group_key: 'tech-business', order_index: 13 },
  { key: 'thaiware', label: 'Thaiware', url: 'https://www.thaiware.com/rss/rss_latestPost_news.php', homepage: 'https://www.thaiware.com', type: 'rss', group_key: 'tech-business', order_index: 14 },
  { key: 'sanook-hitech-computer', label: 'Sanook Hitech Computer', url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/hitech.computer.index.xml', homepage: 'https://hitech.sanook.com', type: 'rss', group_key: 'tech-business', order_index: 15 },
  { key: 'google-tech-th', label: 'Google ข่าวไอที', url: 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss', group_key: 'tech-business', order_index: 16 },

  // International Tech
  { key: 'techcrunch', label: 'TechCrunch', url: 'https://techcrunch.com/feed/', homepage: 'https://techcrunch.com', type: 'rss', group_key: 'international', order_index: 1 },
  { key: 'the-verge', label: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', homepage: 'https://www.theverge.com', type: 'rss', group_key: 'international', order_index: 2 },
  { key: 'ars-technica', label: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', homepage: 'https://arstechnica.com', type: 'rss', group_key: 'international', order_index: 3 },
  { key: 'wired', label: 'WIRED', url: 'https://www.wired.com/feed/rss', homepage: 'https://www.wired.com', type: 'rss', group_key: 'international', order_index: 4 },
  { key: 'engadget', label: 'Engadget', url: 'https://www.engadget.com/rss.xml', homepage: 'https://www.engadget.com', type: 'rss', group_key: 'international', order_index: 5 },
  { key: 'mit-technology-review', label: 'MIT Technology Review', url: 'https://www.technologyreview.com/feed/', homepage: 'https://www.technologyreview.com', type: 'rss', group_key: 'international', order_index: 6 },
  { key: '9to5mac', label: '9to5Mac', url: 'https://9to5mac.com/feed/', homepage: 'https://9to5mac.com', type: 'rss', group_key: 'international', order_index: 7 },
  { key: '9to5google', label: '9to5Google', url: 'https://9to5google.com/feed/', homepage: 'https://9to5google.com', type: 'rss', group_key: 'international', order_index: 8 },
  { key: 'android-authority', label: 'Android Authority', url: 'https://www.androidauthority.com/feed/', homepage: 'https://www.androidauthority.com', type: 'rss', group_key: 'international', order_index: 9 },
  { key: 'android-police', label: 'Android Police', url: 'https://www.androidpolice.com/feed/', homepage: 'https://www.androidpolice.com', type: 'rss', group_key: 'international', order_index: 10 },
  { key: 'macrumors', label: 'MacRumors', url: 'https://feeds.macrumors.com/MacRumors-All', homepage: 'https://www.macrumors.com', type: 'rss', group_key: 'international', order_index: 11 },
  { key: 'tom-hardware', label: 'Tom’s Hardware', url: 'https://www.tomshardware.com/feeds/all', homepage: 'https://www.tomshardware.com', type: 'rss', group_key: 'international', order_index: 12 },
  { key: 'pcmag', label: 'PCMag', url: 'https://www.pcmag.com/feeds', homepage: 'https://www.pcmag.com', type: 'rss', group_key: 'international', order_index: 13 },
  { key: 'zdnet', label: 'ZDNET', url: 'https://www.zdnet.com/news/rss.xml', homepage: 'https://www.zdnet.com', type: 'rss', group_key: 'international', order_index: 14 },
  { key: 'venturebeat', label: 'VentureBeat', url: 'https://venturebeat.com/feed/', homepage: 'https://venturebeat.com', type: 'rss', group_key: 'international', order_index: 15 },
  { key: 'techradar', label: 'TechRadar', url: 'https://www.techradar.com/rss', homepage: 'https://www.techradar.com', type: 'rss', group_key: 'international', order_index: 16 },

  // Thai News
  { key: 'thestandard', label: 'THE STANDARD', url: 'https://thestandard.co/feed/', homepage: 'https://thestandard.co', type: 'rss', group_key: 'thai-news', order_index: 1 },
  { key: 'thaipbs', label: 'Thai PBS', url: 'https://news.thaipbs.or.th/rss/news/home', homepage: 'https://www.thaipbs.or.th', type: 'rss', group_key: 'thai-news', order_index: 2 },
  { key: 'bbc-thai', label: 'BBC News ไทย', url: 'https://feeds.bbci.co.uk/thai/rss.xml', homepage: 'https://www.bbc.com/thai', type: 'rss', group_key: 'thai-news', order_index: 3 },
  { key: 'workpoint-today', label: 'TODAY', url: 'https://www.workpointtoday.com/feed', homepage: 'https://www.workpointtoday.com', type: 'rss', group_key: 'thai-news', order_index: 4 },
  { key: 'sanook-news', label: 'Sanook News', url: 'https://rssfeeds.sanook.com/rss/feeds/sanook/news.index.xml', homepage: 'https://www.sanook.com/news', type: 'rss', group_key: 'thai-news', order_index: 5 },
  { key: 'the-momentum', label: 'The Momentum', url: 'https://themomentum.co/feed/', homepage: 'https://themomentum.co', type: 'rss', group_key: 'thai-news', order_index: 6 },
  { key: 'nation', label: 'Nation TV', url: 'https://www.nationtv.tv/main/rss', homepage: 'https://www.nationtv.tv', type: 'rss', group_key: 'thai-news', order_index: 7 },
  { key: 'matichon', label: 'Matichon', url: 'https://www.matichon.co.th/feed', homepage: 'https://www.matichon.co.th', type: 'rss', group_key: 'thai-news', order_index: 8 },
  { key: 'dailynews', label: 'DailyNews', url: 'https://www.dailynews.co.th/feed', homepage: 'https://www.dailynews.co.th', type: 'rss', group_key: 'thai-news', order_index: 9 },
  { key: 'khaosod', label: 'Khaosod', url: 'https://www.khaosod.co.th/feed', homepage: 'https://www.khaosod.co.th', type: 'rss', group_key: 'thai-news', order_index: 10 },
  { key: 'mgronline', label: 'MGR Online', url: 'https://mgronline.com/store/rss/index.xml', homepage: 'https://mgronline.com', type: 'rss', group_key: 'thai-news', order_index: 11 },
  { key: 'prachachat', label: 'Prachachat', url: 'https://www.prachachat.net/feed', homepage: 'https://www.prachachat.net', type: 'rss', group_key: 'thai-news', order_index: 12 },

  // Mobile
  { key: 'specphone', label: 'Specphone', url: 'https://specphone.com/web/feed', homepage: 'https://specphone.com', type: 'rss', group_key: 'mobile', order_index: 1 },
  { key: 'appdisqus', label: 'AppDisqus', url: 'https://www.appdisqus.com/feed/', homepage: 'https://www.appdisqus.com', type: 'rss', group_key: 'mobile', order_index: 2 },
  { key: 'flashfly', label: 'Flashfly', url: 'https://www.flashfly.net/wp/feed', homepage: 'https://www.flashfly.net', type: 'rss', group_key: 'mobile', order_index: 3 },
  { key: 'iphone-mod', label: 'iMoD', url: 'https://www.iphonemod.net/feed', homepage: 'https://www.iphonemod.net', type: 'rss', group_key: 'mobile', order_index: 4 },
  { key: 'droidsans', label: 'DroidSans', url: 'https://droidsans.com/feed/', homepage: 'https://droidsans.com', type: 'rss', group_key: 'mobile', order_index: 5 },
  { key: 'whatphone', label: 'WhatPhone', url: 'https://whatphone.net/feed/', homepage: 'https://whatphone.net', type: 'rss', group_key: 'mobile', order_index: 6 },
  { key: 'google-android', label: 'Google Android', url: 'https://news.google.com/rss/search?q=Android&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss', group_key: 'mobile', order_index: 7 },
  { key: 'google-iphone', label: 'Apple / iPhone', url: 'https://news.google.com/rss/search?q=Apple+OR+iPhone&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss', group_key: 'mobile', order_index: 8 },

  // Computer & Gaming
  { key: 'notebookspec', label: 'NotebookSPEC', url: 'https://notebookspec.com/web/feed', homepage: 'https://notebookspec.com', type: 'rss', group_key: 'computer-games', order_index: 1 },
  { key: 'gamingdose', label: 'GamingDose', url: 'https://www.gamingdose.com/feed/', homepage: 'https://www.gamingdose.com', type: 'rss', group_key: 'computer-games', order_index: 2 },
  { key: 'game-ded', label: 'Game-Ded', url: 'https://www.game-ded.com/feed', homepage: 'https://www.game-ded.com', type: 'rss', group_key: 'computer-games', order_index: 3 },
  { key: 'gamemonday', label: 'GameMonday', url: 'https://www.gamemonday.com/feed', homepage: 'https://www.gamemonday.com', type: 'rss', group_key: 'computer-games', order_index: 4 },
  { key: 'extremeit', label: 'Extreme IT', url: 'https://www.extremeit.com/feed/', homepage: 'https://www.extremeit.com', type: 'rss', group_key: 'computer-games', order_index: 5 },
  { key: 'google-cloud', label: 'Cloud / DC', url: 'https://news.google.com/rss/search?q=Cloud+OR+Data+Center&hl=th&gl=TH&ceid=TH:th', homepage: 'https://news.google.com', type: 'rss', group_key: 'computer-games', order_index: 6 },
];

async function seed() {
  console.log('Connecting to Supabase:', SUPABASE_URL);

  // 1. Upsert Groups
  console.log('Upserting feed_groups...');
  const { data: groupData, error: groupError } = await supabase
    .from('feed_groups')
    .upsert(FEED_GROUPS, { onConflict: 'key' });

  if (groupError) {
    console.error('Error inserting groups:', groupError);
    if (groupError.code === 'PGRST205') {
      console.log('\nNOTE: The table public.feed_groups does not exist yet.');
      console.log('Please run the SQL migration in supabase/schema.sql in the Supabase SQL editor first!\n');
    }
    return;
  }
  console.log('✓ Successfully inserted/updated feed_groups');

  // 2. Upsert Sources
  console.log('Upserting feed_sources...');
  const { data: sourceData, error: sourceError } = await supabase
    .from('feed_sources')
    .upsert(
      FEED_SOURCES.map((s) => ({ ...s, is_active: true })),
      { onConflict: 'key' }
    );

  if (sourceError) {
    console.error('Error inserting sources:', sourceError);
    return;
  }
  console.log(`✓ Successfully inserted/updated ${FEED_SOURCES.length} feed_sources`);
}

seed().catch(console.error);
