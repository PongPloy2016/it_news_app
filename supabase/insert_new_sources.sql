-- ==============================================================================
-- TechThaiNews / IT News App - Insert New Feed Sources
-- รันใน Supabase SQL Editor:
-- https://supabase.com/dashboard/project/zpigezwdsjelwvdpyahb/sql/new
-- ==============================================================================

INSERT INTO public.feed_sources (key, label, url, homepage, type, group_key, order_index, is_active)
VALUES
    -- 🤖 1. AI Innovation (ปัญญาประดิษฐ์และ AI)
    ('google-ai-th', 'Google ข่าว AI (ไทย)', 'https://news.google.com/rss/search?q=AI+OR+ปัญญาประดิษฐ์&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'ai-innovation', 1, true),
    ('techcrunch-ai', 'TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', 'https://techcrunch.com', 'rss', 'ai-innovation', 2, true),
    ('venturebeat-ai', 'VentureBeat AI', 'https://venturebeat.com/category/ai/feed/', 'https://venturebeat.com', 'rss', 'ai-innovation', 3, true),

    -- 🔒 2. Cybersecurity (ความปลอดภัยไซเบอร์และเตือนภัย)
    ('thehackernews', 'The Hacker News', 'https://feeds.feedburner.com/TheHackersNews', 'https://thehackernews.com', 'rss', 'cybersecurity', 1, true),
    ('google-cyber-th', 'Google เตือนภัยไซเบอร์ & แก๊งคอล', 'https://news.google.com/rss/search?q=ไซเบอร์+OR+แฮกเกอร์+OR+แก๊งคอลเซ็นเตอร์&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'cybersecurity', 2, true),
    ('google-security-th', 'Google ข่าวความมั่นคงปลอดภัย', 'https://news.google.com/rss/search?q=ความมั่นคงปลอดภัยไซเบอร์+OR+ภัยไซเบอร์&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'cybersecurity', 3, true),

    -- 🚗 3. EV & Vehicles (ยานยนต์ไฟฟ้าและเทคโนโลยี EV)
    ('autolifethailand', 'Autolife Thailand', 'https://autolifethailand.tv/feed/', 'https://autolifethailand.tv', 'rss', 'ev-vehicles', 1, true),
    ('google-ev-th', 'Google ข่าวรถยนต์ไฟฟ้า EV', 'https://news.google.com/rss/search?q=รถยนต์ไฟฟ้า+OR+EV&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'ev-vehicles', 2, true),
    ('insideevs', 'InsideEVs', 'https://insideevs.com/rss/news/all/', 'https://insideevs.com', 'rss', 'ev-vehicles', 3, true),

    -- 🚀 4. Science & Space (วิทยาศาสตร์และสำรวจอวกาศ)
    ('google-space-th', 'Google ข่าวอวกาศ & ดาราศาสตร์', 'https://news.google.com/rss/search?q=อวกาศ+OR+ดาราศาสตร์+OR+SpaceX&hl=th&gl=TH&ceid=TH:th', 'https://news.google.com', 'rss', 'science-space', 1, true),
    ('space-com', 'Space.com', 'https://www.space.com/feeds/all', 'https://www.space.com', 'rss', 'science-space', 2, true),

    -- 💰 5. FinTech & Crypto (การเงินดิจิทัลและบล็อกเชน)
    ('siamblockchain', 'Siam Blockchain', 'https://siamblockchain.com/feed/', 'https://siamblockchain.com', 'rss', 'fintech-crypto', 1, true),
    ('bitcoinaddict', 'Bitcoin Addict', 'https://bitcoinaddict.org/feed/', 'https://bitcoinaddict.org', 'rss', 'fintech-crypto', 2, true),
    ('cointelegraph', 'Cointelegraph', 'https://cointelegraph.com/rss', 'https://cointelegraph.com', 'rss', 'fintech-crypto', 3, true),

    -- 💻 6. Developer & Coding (โปรแกรมมิ่งและนักพัฒนา)
    ('dev-to', 'DEV Community', 'https://dev.to/feed', 'https://dev.to', 'rss', 'developer-coding', 1, true),
    ('github-blog', 'GitHub Blog', 'https://github.blog/feed/', 'https://github.blog', 'rss', 'developer-coding', 2, true),
    ('freecodecamp', 'freeCodeCamp', 'https://www.freecodecamp.org/news/rss/', 'https://www.freecodecamp.org', 'rss', 'developer-coding', 3, true)
ON CONFLICT (key) DO UPDATE
SET label = EXCLUDED.label,
    url = EXCLUDED.url,
    homepage = EXCLUDED.homepage,
    type = EXCLUDED.type,
    group_key = EXCLUDED.group_key,
    order_index = EXCLUDED.order_index,
    is_active = EXCLUDED.is_active;

-- ตรวจสอบผลลัพธ์จำนวน Feed Sources ในแต่ละหมวดหมู่
SELECT 
    fg.order_index,
    fg.key AS group_key,
    fg.label AS group_label,
    COUNT(fs.id) AS sources_count
FROM public.feed_groups fg
LEFT JOIN public.feed_sources fs ON fs.group_key = fg.key AND fs.is_active = true
GROUP BY fg.order_index, fg.key, fg.label
ORDER BY fg.order_index;
