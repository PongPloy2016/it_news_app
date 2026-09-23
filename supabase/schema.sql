-- ==============================================================================
-- TechThaiNews / IT News App - Supabase Database Schema & Initial Data
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zpigezwdsjelwvdpyahb/sql/new
-- ==============================================================================

-- 1. Create Feed Groups Table
CREATE TABLE IF NOT EXISTS public.feed_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#2F6FED',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Feed Sources Table
CREATE TABLE IF NOT EXISTS public.feed_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    homepage TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'rss',
    group_key TEXT REFERENCES public.feed_groups(key) ON DELETE SET NULL,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.feed_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_sources ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Read Policies
DROP POLICY IF EXISTS "Public can view active feed groups" ON public.feed_groups;
CREATE POLICY "Public can view active feed groups"
    ON public.feed_groups FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Public can view active feed sources" ON public.feed_sources;
CREATE POLICY "Public can view active feed sources"
    ON public.feed_sources FOR SELECT
    USING (is_active = true);

-- Allow full access for service_role / secret key
DROP POLICY IF EXISTS "Service role can manage feed groups" ON public.feed_groups;
CREATE POLICY "Service role can manage feed groups"
    ON public.feed_groups FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage feed sources" ON public.feed_sources;
CREATE POLICY "Service role can manage feed sources"
    ON public.feed_sources FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Insert Feed Groups
INSERT INTO public.feed_groups (key, label, color, order_index)
VALUES
    ('tech-business', 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล', '#2F6FED', 1),
    ('international', 'ข่าวไอทีต่างประเทศ', '#0284C7', 2),
    ('thai-news', 'ข่าวสำนักข่าวไทย', '#D946EF', 3),
    ('mobile', 'ข่าวมือถือและอุปกรณ์', '#17A673', 4),
    ('computer-games', 'ข่าวคอมพิวเตอร์และเกม', '#F59E0B', 5)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    color = EXCLUDED.color,
    order_index = EXCLUDED.order_index;

-- 6. Insert Feed Sources
INSERT INTO public.feed_sources (key, label, url, homepage, type, group_key, order_index, is_active)
VALUES
    -- Tech & Business
    ('blognone', 'Blognone', 'https://www.blognone.com/atom.xml', 'https://www.blognone.com', 'atom', 'tech-business', 1, true),
    ('brandinside', 'Brand Inside', 'https://brandinside.asia/feed/', 'https://brandinside.asia', 'rss', 'tech-business', 2, true),
    ('marketingoops', 'Marketing Oops', 'https://www.marketingoops.com/feed/', 'https://www.marketingoops.com', 'rss', 'tech-business', 3, true),
    ('adpt-news', 'ADPT News', 'https://www.adpt.news/feed/', 'https://www.adpt.news', 'rss', 'tech-business', 4, true),
    ('borntodev', 'Born to Dev', 'https://www.borntodev.com/feed/', 'https://www.borntodev.com', 'rss', 'tech-business', 5, true),
    ('techsauce', 'Techsauce', 'https://techsauce.co/feed', 'https://techsauce.co', 'rss', 'tech-business', 6, true),
    ('beartai', 'Beartai', 'https://www.beartai.com/feed/', 'https://www.beartai.com', 'rss', 'tech-business', 7, true),
    ('techtalkthai', 'TechTalkThai', 'https://www.techtalkthai.com/feed/', 'https://www.techtalkthai.com', 'rss', 'tech-business', 8, true),
    ('techhub', 'Techhub', 'https://www.techhub.in.th/feed/', 'https://www.techhub.in.th', 'rss', 'tech-business', 9, true),
    ('it24hrs', 'IT24Hrs', 'https://it24hrs.com/feed/', 'https://it24hrs.com', 'rss', 'tech-business', 10, true),
    ('spin9', 'spin9', 'https://spin9.me/feed/', 'https://spin9.me', 'rss', 'tech-business', 11, true),
    ('techoffside', 'TechOffside', 'https://www.techoffside.com/feed/', 'https://www.techoffside.com', 'rss', 'tech-business', 12, true),
    ('thumbsup', 'Thumbsup', 'https://www.thumbsup.in.th/feed', 'https://www.thumbsup.in.th', 'rss', 'tech-business', 13, true),
    ('thaiware', 'Thaiware', 'https://www.thaiware.com/rss/rss_latestPost_news.php', 'https://www.thaiware.com', 'rss', 'tech-business', 14, true),
    ('sanook-hitech-computer', 'Sanook Hitech Computer', 'https://rssfeeds.sanook.com/rss/feeds/sanook/hitech.computer.index.xml', 'https://hitech.sanook.com', 'rss', 'tech-business', 15, true),
    ('google-tech-th', 'Google ข่าวไอที', 'https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'tech-business', 16, true),

    -- International Tech
    ('techcrunch', 'TechCrunch', 'https://techcrunch.com/feed/', 'https://techcrunch.com', 'rss', 'international', 1, true),
    ('the-verge', 'The Verge', 'https://www.theverge.com/rss/index.xml', 'https://www.theverge.com', 'rss', 'international', 2, true),
    ('ars-technica', 'Ars Technica', 'https://feeds.arstechnica.com/arstechnica/index', 'https://arstechnica.com', 'rss', 'international', 3, true),
    ('wired', 'WIRED', 'https://www.wired.com/feed/rss', 'https://www.wired.com', 'rss', 'international', 4, true),
    ('engadget', 'Engadget', 'https://www.engadget.com/rss.xml', 'https://www.engadget.com', 'rss', 'international', 5, true),
    ('mit-technology-review', 'MIT Technology Review', 'https://www.technologyreview.com/feed/', 'https://www.technologyreview.com', 'rss', 'international', 6, true),
    ('9to5mac', '9to5Mac', 'https://9to5mac.com/feed/', 'https://9to5mac.com', 'rss', 'international', 7, true),
    ('9to5google', '9to5Google', 'https://9to5google.com/feed/', 'https://9to5google.com', 'rss', 'international', 8, true),
    ('android-authority', 'Android Authority', 'https://www.androidauthority.com/feed/', 'https://www.androidauthority.com', 'rss', 'international', 9, true),
    ('android-police', 'Android Police', 'https://www.androidpolice.com/feed/', 'https://www.androidpolice.com', 'rss', 'international', 10, true),
    ('macrumors', 'MacRumors', 'https://feeds.macrumors.com/MacRumors-All', 'https://www.macrumors.com', 'rss', 'international', 11, true),
    ('tom-hardware', 'Tom’s Hardware', 'https://www.tomshardware.com/feeds/all', 'https://www.tomshardware.com', 'rss', 'international', 12, true),
    ('pcmag', 'PCMag', 'https://www.pcmag.com/feeds', 'https://www.pcmag.com', 'rss', 'international', 13, true),
    ('zdnet', 'ZDNET', 'https://www.zdnet.com/news/rss.xml', 'https://www.zdnet.com', 'rss', 'international', 14, true),
    ('venturebeat', 'VentureBeat', 'https://venturebeat.com/feed/', 'https://venturebeat.com', 'rss', 'international', 15, true),
    ('techradar', 'TechRadar', 'https://www.techradar.com/rss', 'https://www.techradar.com', 'rss', 'international', 16, true),

    -- Thai News
    ('thestandard', 'THE STANDARD', 'https://thestandard.co/feed/', 'https://thestandard.co', 'rss', 'thai-news', 1, true),
    ('thaipbs', 'Thai PBS', 'https://news.thaipbs.or.th/rss/news/home', 'https://www.thaipbs.or.th', 'rss', 'thai-news', 2, true),
    ('bbc-thai', 'BBC News ไทย', 'https://feeds.bbci.co.uk/thai/rss.xml', 'https://www.bbc.com/thai', 'rss', 'thai-news', 3, true),
    ('workpoint-today', 'TODAY', 'https://www.workpointtoday.com/feed', 'https://www.workpointtoday.com', 'rss', 'thai-news', 4, true),
    ('sanook-news', 'Sanook News', 'https://rssfeeds.sanook.com/rss/feeds/sanook/news.index.xml', 'https://www.sanook.com/news', 'rss', 'thai-news', 5, true),
    ('the-momentum', 'The Momentum', 'https://themomentum.co/feed/', 'https://themomentum.co', 'rss', 'thai-news', 6, true),
    ('nation', 'Nation TV', 'https://www.nationtv.tv/main/rss', 'https://www.nationtv.tv', 'rss', 'thai-news', 7, true),
    ('matichon', 'Matichon', 'https://www.matichon.co.th/feed', 'https://www.matichon.co.th', 'rss', 'thai-news', 8, true),
    ('dailynews', 'DailyNews', 'https://www.dailynews.co.th/feed', 'https://www.dailynews.co.th', 'rss', 'thai-news', 9, true),
    ('khaosod', 'Khaosod', 'https://www.khaosod.co.th/feed', 'https://www.khaosod.co.th', 'rss', 'thai-news', 10, true),
    ('mgronline', 'MGR Online', 'https://mgronline.com/store/rss/index.xml', 'https://mgronline.com', 'rss', 'thai-news', 11, true),
    ('prachachat', 'Prachachat', 'https://www.prachachat.net/feed', 'https://www.prachachat.net', 'rss', 'thai-news', 12, true),

    -- Mobile & Devices
    ('specphone', 'Specphone', 'https://specphone.com/web/feed', 'https://specphone.com', 'rss', 'mobile', 1, true),
    ('appdisqus', 'AppDisqus', 'https://www.appdisqus.com/feed/', 'https://www.appdisqus.com', 'rss', 'mobile', 2, true),
    ('flashfly', 'Flashfly', 'https://www.flashfly.net/wp/feed', 'https://www.flashfly.net', 'rss', 'mobile', 3, true),
    ('iphone-mod', 'iMoD', 'https://www.iphonemod.net/feed', 'https://www.iphonemod.net', 'rss', 'mobile', 4, true),
    ('droidsans', 'DroidSans', 'https://droidsans.com/feed/', 'https://droidsans.com', 'rss', 'mobile', 5, true),
    ('whatphone', 'WhatPhone', 'https://whatphone.net/feed/', 'https://whatphone.net', 'rss', 'mobile', 6, true),
    ('google-android', 'Google Android', 'https://news.google.com/rss/search?q=Android&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'mobile', 7, true),
    ('google-iphone', 'Apple / iPhone', 'https://news.google.com/rss/search?q=Apple+OR+iPhone&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'mobile', 8, true),

    -- Computer & Gaming
    ('notebookspec', 'NotebookSPEC', 'https://notebookspec.com/web/feed', 'https://notebookspec.com', 'rss', 'computer-games', 1, true),
    ('gamingdose', 'GamingDose', 'https://www.gamingdose.com/feed/', 'https://www.gamingdose.com', 'rss', 'computer-games', 2, true),
    ('game-ded', 'Game-Ded', 'https://www.game-ded.com/feed', 'https://www.game-ded.com', 'rss', 'computer-games', 3, true),
    ('gamemonday', 'GameMonday', 'https://www.gamemonday.com/feed', 'https://www.gamemonday.com', 'rss', 'computer-games', 4, true),
    ('extremeit', 'Extreme IT', 'https://www.extremeit.com/feed/', 'https://www.extremeit.com', 'rss', 'computer-games', 5, true),
    ('google-cloud', 'Cloud / DC', 'https://news.google.com/rss/search?q=Cloud+OR+Data+Center&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'computer-games', 6, true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    url = EXCLUDED.url,
    homepage = EXCLUDED.homepage,
    type = EXCLUDED.type,
    group_key = EXCLUDED.group_key,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;
