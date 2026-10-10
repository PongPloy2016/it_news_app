-- ==============================================================================
-- TechThaiNews / IT News App - Supabase Migration Script
-- เพิ่มระบบ เปิด / ปิด หรือ ซ่อน / แสดง (Enable/Disable / Show/Hide) หมวดหมู่ข่าว (feed_groups)
--
-- วิธีใช้งาน:
-- 1. ไปที่ Supabase Dashboard -> https://supabase.com/dashboard/project/zpigezwdsjelwvdpyahb/sql/new
-- 2. วางคำสั่งด้านล่างนี้ แล้วกด "Run"
-- ==============================================================================

-- 1. เพิ่มคอลัมน์ is_active ในตาราง public.feed_groups (ค่าเริ่มต้น true = เปิดใช้งาน)
ALTER TABLE public.feed_groups 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. สร้างดัชนี (Index) เพื่อให้การ Query หมวดหมู่ที่เปิดใช้งานมีความเร็วสูงสุด
CREATE INDEX IF NOT EXISTS idx_feed_groups_is_active 
ON public.feed_groups (is_active, order_index);

-- 3. อัปเดต Row Level Security (RLS) เพื่อให้ผู้ใช้งานทั่วไป (Anon/Public) เห็นเฉพาะหมวดที่เปิดใช้งาน
DROP POLICY IF EXISTS "Public can view active feed groups" ON public.feed_groups;
CREATE POLICY "Public can view active feed groups"
    ON public.feed_groups FOR SELECT
    USING (is_active = true);

-- 4. มั่นใจว่า Service Role / Admin สามารถจัดการได้ทั้งหมด (SELECT, INSERT, UPDATE, DELETE)
DROP POLICY IF EXISTS "Service role can manage feed groups" ON public.feed_groups;
CREATE POLICY "Service role can manage feed groups"
    ON public.feed_groups FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. ตัวอย่างการทดสอบเปิด/ปิดหมวดหมู่:
-- ปิดการใช้งานหมวด tech-business (ตามภาพตัวอย่าง):
-- UPDATE public.feed_groups SET is_active = false WHERE key = 'tech-business';

-- เปิดใช้งานหมวด tech-business:
-- UPDATE public.feed_groups SET is_active = true WHERE key = 'tech-business';
