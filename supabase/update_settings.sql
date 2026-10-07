-- ==============================================================================
-- TechThaiNews / IT News App - Supabase Migration Script
-- เพิ่มฟิลด์การตั้งค่าใหม่ (Settings Remote Config) ในตาราง public.app_settings
-- 
-- วิธีใช้งาน:
-- 1. ไปที่ Supabase Dashboard -> โครงการของคุณ (zpigezwdsjelwvdpyahb)
-- 2. ไปที่เมนู "SQL Editor" ด้านซ้าย (หรือ https://supabase.com/dashboard/project/zpigezwdsjelwvdpyahb/sql/new)
-- 3. คัดลอกคำสั่งด้านล่างนี้ไปวาง แล้วกดปุ่ม "Run"
-- ==============================================================================

-- 1. เพิ่มคอลัมน์การตั้งค่ารูปแบบการแสดงผลข่าว (Visual Card Layout)
-- รองรับ: 'magazine' (การ์ดใหญ่รูปเด่น), 'compact' (กะทัดรัด), 'grid' (ตารางคู่ 2 คอลัมน์)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS default_card_layout TEXT NOT NULL DEFAULT 'magazine';

-- 2. เพิ่มคอลัมน์ธีมสีเริ่มต้นของแอป (Theme Mode)
-- รองรับ: 'system' (ตามระบบเครื่อง), 'light' (สว่าง), 'dark' (มืด)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS default_theme_mode TEXT NOT NULL DEFAULT 'system';

-- 3. เพิ่มคอลัมน์ช่องทางการเปิดลิงก์ข่าวฉบับเต็มเริ่มต้น (Link Open Mode)
-- รองรับ: 'in_app' (In-App WebView ในตัวแอป), 'external' (เปิดเบราว์เซอร์ของเครื่อง Chrome/Safari)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS default_link_open_mode TEXT NOT NULL DEFAULT 'in_app';

-- 4. เพิ่มคอลัมน์ขนาดตัวอักษรเริ่มต้น (Typography Font Size)
-- รองรับ: 'small' (เล็ก), 'medium' (ปกติ), 'large' (ใหญ่)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS default_font_size TEXT NOT NULL DEFAULT 'medium';

-- 5. เพิ่มคอลัมน์โหมดประหยัดเน็ตเริ่มต้น (Data Saver Default)
-- true = ปิดการโหลดรูปในรายการข่าวเพื่อประหยัดเน็ต 3G/4G/5G, false = โหลดภาพตามปกติ
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS data_saver_default BOOLEAN NOT NULL DEFAULT false;

-- 6. เพิ่มคอลัมน์เปิด/ปิดระบบคลาวด์ซิงค์บุ๊กมาร์ก (Supabase Cloud Sync Master Switch)
-- true = เปิดให้ซิงค์และสำรองข้อมูลข้ามเครื่องได้, false = ปิดบริการชั่วคราว
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS cloud_sync_enabled BOOLEAN NOT NULL DEFAULT true;

-- 7. เพิ่มคอลัมน์จำนวนข่าวอื่นๆ ที่น่าสนใจในหน้ารายละเอียดข่าว (Related News Limit)
-- กำหนดจำนวนข่าวที่ต้องการแนะนำท้ายหน้า Article เช่น 6, 10, 15 ข่าว
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS related_news_limit INTEGER NOT NULL DEFAULT 10;

-- 8. เพิ่มคอลัมน์ชื่อและ URL แหล่งข่าวต้นฉบับหลัก (RSS Source Info)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS rss_source_name TEXT NOT NULL DEFAULT 'Blognone';

ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS rss_source_url TEXT NOT NULL DEFAULT 'https://www.blognone.com';

-- 9. เพิ่มคอลัมน์ช่องทางติดต่อหรือคอมมูนิตี้เพิ่มเติม (Custom Community/Contact URL)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS contact_custom_url TEXT DEFAULT NULL;

-- ==============================================================================
-- อัปเดตข้อมูลแถว 'default' ให้มีค่าเริ่มต้นครบถ้วน
-- ==============================================================================
UPDATE public.app_settings
SET
    default_card_layout = COALESCE(default_card_layout, 'magazine'),
    default_theme_mode = COALESCE(default_theme_mode, 'system'),
    default_link_open_mode = COALESCE(default_link_open_mode, 'in_app'),
    default_font_size = COALESCE(default_font_size, 'medium'),
    data_saver_default = COALESCE(data_saver_default, false),
    cloud_sync_enabled = COALESCE(cloud_sync_enabled, true),
    related_news_limit = COALESCE(related_news_limit, 10),
    rss_source_name = COALESCE(rss_source_name, 'Blognone'),
    rss_source_url = COALESCE(rss_source_url, 'https://www.blognone.com'),
    updated_at = timezone('utc'::text, now())
WHERE id = 'default';

-- ==============================================================================
-- ใส่คำอธิบายฟิลด์ (Table & Column Comments) สำหรับดูใน Supabase Dashboard
-- ==============================================================================
COMMENT ON COLUMN public.app_settings.default_card_layout IS 'รูปแบบการแสดงผลข่าวเริ่มต้น: magazine, compact, grid';
COMMENT ON COLUMN public.app_settings.default_theme_mode IS 'ธีมเริ่มต้นของแอป: system, light, dark';
COMMENT ON COLUMN public.app_settings.default_link_open_mode IS 'ช่องทางเปิดลิงก์ข่าวเริ่มต้น: in_app, external';
COMMENT ON COLUMN public.app_settings.default_font_size IS 'ขนาดตัวอักษรเริ่มต้น: small, medium, large';
COMMENT ON COLUMN public.app_settings.data_saver_default IS 'โหมดประหยัดอินเทอร์เน็ตเริ่มต้น (ไม่โหลดรูปในหน้ารวมข่าว)';
COMMENT ON COLUMN public.app_settings.cloud_sync_enabled IS 'สวิตช์เปิด/ปิดระบบ Cloud Sync สำรองบุ๊กมาร์ก';
COMMENT ON COLUMN public.app_settings.related_news_limit IS 'จำนวนรายการข่าวที่น่าสนใจในหน้ารายละเอียดข่าว (เช่น 10)';
COMMENT ON COLUMN public.app_settings.rss_source_name IS 'ชื่อแสดงแหล่งข่าวหลัก';
COMMENT ON COLUMN public.app_settings.rss_source_url IS 'URL แหล่งข่าวหลัก';
COMMENT ON COLUMN public.app_settings.contact_custom_url IS 'ลิงก์ช่องทางติดต่อหรือคอมมูนิตี้เพิ่มเติม (เช่น Facebook/Discord)';

-- ตรวจสอบผลลัพธ์หลังรัน
SELECT 
    id,
    default_card_layout,
    default_theme_mode,
    default_link_open_mode,
    default_font_size,
    data_saver_default,
    cloud_sync_enabled,
    related_news_limit,
    rss_source_name,
    rss_source_url,
    updated_at
FROM public.app_settings
WHERE id = 'default';
