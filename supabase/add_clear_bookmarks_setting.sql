-- ==============================================================================
-- TechThaiNews / IT News App - Supabase Migration Script
-- เพิ่มฟิลด์ควบคุมการแสดงผลปุ่ม "ล้างข่าวที่บันทึกไว้ทั้งหมด" (Clear Bookmarks Master Switch)
-- ในตาราง public.app_settings
-- 
-- วิธีใช้งาน:
-- 1. ไปที่ Supabase Dashboard -> โครงการของคุณ (zpigezwdsjelwvdpyahb)
-- 2. ไปที่เมนู "SQL Editor" ด้านซ้าย (หรือ https://supabase.com/dashboard/project/zpigezwdsjelwvdpyahb/sql/new)
-- 3. คัดลอกคำสั่งด้านล่างนี้ไปวาง แล้วกดปุ่ม "Run"
-- ==============================================================================

-- 1. เพิ่มคอลัมน์ clear_bookmarks_enabled
-- ค่าเริ่มต้นเป็น false เพื่อซ่อนปุ่มล้างข่าวที่บันทึกไว้ทั้งหมดออกจากแอป (ป้องกันผู้ใช้ลบข้อมูลโดยไม่ตั้งใจ)
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS clear_bookmarks_enabled BOOLEAN NOT NULL DEFAULT false;

-- 2. อัปเดตข้อมูลแถว 'default' ให้มีค่าเริ่มต้นเป็น false (ซ่อนไว้ก่อน)
UPDATE public.app_settings
SET
    clear_bookmarks_enabled = COALESCE(clear_bookmarks_enabled, false),
    updated_at = timezone('utc'::text, now())
WHERE id = 'default';

-- 3. ใส่คำอธิบายฟิลด์สำหรับ Supabase Dashboard
COMMENT ON COLUMN public.app_settings.clear_bookmarks_enabled IS 'สวิตช์เปิด/ปิดปุ่มล้างข่าวที่บันทึกไว้ทั้งหมด (false = ซ่อน/ปิดใช้งาน, true = แสดงปุ่มให้ล้างได้)';

-- 4. ตรวจสอบผลลัพธ์หลังรัน
SELECT 
    id,
    clear_bookmarks_enabled,
    cloud_sync_enabled,
    updated_at
FROM public.app_settings
WHERE id = 'default';
