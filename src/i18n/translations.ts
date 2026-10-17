import { NativeModules, Platform } from 'react-native';
import { LanguageOption } from '../types';

/**
 * Detect user device language
 * Returns 'th' if device language is Thai, otherwise 'en'
 */
export function getDeviceLanguage(): 'th' | 'en' {
  try {
    const locale =
      Intl?.DateTimeFormat?.().resolvedOptions?.().locale ||
      (Platform.OS === 'ios'
        ? NativeModules.SettingsManager?.settings?.AppleLocale ||
          NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
        : NativeModules.I18nManager?.localeIdentifier);

    if (locale && typeof locale === 'string' && locale.toLowerCase().startsWith('th')) {
      return 'th';
    }
  } catch {
    // fallback
  }
  return 'en';
}

/**
 * Resolve active language based on user setting ('system' | 'th' | 'en')
 */
export function resolveLanguage(setting?: LanguageOption): 'th' | 'en' {
  if (setting === 'th') return 'th';
  if (setting === 'en') return 'en';
  return getDeviceLanguage();
}

export const translations = {
  th: {
    // Navigation Bottom Tabs
    tab_latest: 'ข่าวล่าสุด',
    tab_categories: 'หมวดหมู่',
    tab_search: 'ค้นหา',
    tab_bookmarks: 'บันทึก',
    tab_settings: 'ตั้งค่า',

    // Settings Header & Brand Banner
    settings_title: 'ตั้งค่า',
    brand_tagline: 'ติดตามข่าวสารวงการไอทีและเทคโนโลยีทันโลก',
    brand_footer: 'TechThaiNews v{version} • ออกแบบเพื่อคนรักไอที',
    announcement_title: 'ประกาศจากระบบ',
    badge_status_ready: 'พร้อมใช้งาน',
    badge_quick_ai: 'AI Reader',
    badge_quick_cloud: 'Cloud Sync',
    badge_quick_lang: '2 ภาษา (TH/EN)',

    // Group Categories
    group_display_lang: 'การแสดงผลและภาษา',
    group_reading: 'การอ่านและประสิทธิภาพ',
    group_sync_storage: 'คลาวด์และพื้นที่จัดเก็บ',
    group_support_about: 'ช่วยเหลือและเกี่ยวกับแอป',

    // Section 1: Language
    section_language: 'ภาษาของแอป (Language)',
    section_language_sub: 'เลือกภาษาไทย ภาษาอังกฤษ หรือตามระบบเครื่อง',
    lang_system: 'ตามระบบ',
    lang_th: 'ไทย',
    lang_en: 'English',
    lang_system_hint_th: 'ภาษาเครื่อง: ไทย',
    lang_system_hint_en: 'ภาษาเครื่อง: อังกฤษ',

    // Section 2: Card Layout
    section_card_layout: 'รูปแบบการแสดงผลข่าว',
    section_card_layout_sub: 'เลือกสไตล์การจัดวางการ์ดข่าวที่คุณถนัดที่สุด',
    layout_compact: 'กะทัดรัด',
    layout_compact_desc: 'อ่านข่าวได้เยอะ',
    layout_magazine: 'การ์ดใหญ่',
    layout_magazine_desc: 'รูปเด่นคมชัด',
    layout_grid: 'ตารางคู่',
    layout_grid_desc: '2 คอลัมน์กระชับ',

    // Section 3: Appearance / Theme
    section_theme: 'ธีมสีของแอป',
    section_theme_sub: 'ปรับโทนสีหน้าจอตามความสะดวกสายตา',
    theme_system: 'ตามระบบ',
    theme_system_desc: 'สลับอัตโนมัติ',
    theme_light: 'สว่าง คลีน',
    theme_light_desc: 'พื้นขาวสบายตา',
    theme_dark: 'มืด สเลท',
    theme_dark_desc: 'เนวี่สบายตา',
    theme_midnight: 'มิดไนท์',
    theme_midnight_desc: 'ดำสนิท OLED',
    theme_sepia: 'ถนอมสายตา',
    theme_sepia_desc: 'กระดาษนวลอุ่น',
    theme_tech: 'ไซเบอร์',
    theme_tech_desc: 'ไอทีบลูเทค',

    // Section 4: Font Size
    section_font_size: 'ขนาดตัวอักษร (Typography)',
    section_font_size_sub: 'ปรับขนาดข้อความข่าวให้อ่านสบายตาที่สุด',
    font_small: 'เล็ก',
    font_medium: 'ปกติ',
    font_large: 'ใหญ่',
    preview_tag: 'ตัวอย่างการแสดงผลจริง',
    preview_standard: 'ขนาดมาตรฐาน',
    preview_headline: 'Google และ Apple ประกาศมาตรฐานใหม่สำหรับ AI ในสมาร์ตโฟน',
    preview_desc: 'เทคโนโลยีประมวลผลบนเครื่อง (On-Device AI) ช่วยให้การทำงานรวดเร็วขึ้น 40% และรักษาความปลอดภัยข้อมูล...',
    preview_meta: 'Blognone • 5 นาทีที่แล้ว • อ่าน 2 นาที',

    // Section 5: Reading Experience & Links
    section_reading: 'การอ่านและการเปิดลิงก์',
    section_reading_sub: 'ตั้งค่าช่องทางการเปิดเนื้อหาข่าวฉบับเต็ม',
    link_channel_label: 'ช่องทางการเปิดลิงก์ข่าวต้นฉบับ:',
    link_in_app: 'ในแอป (In-App WebView)',
    link_external: 'เบราว์เซอร์ของเครื่อง',
    data_saver_title: 'โหมดประหยัดอินเทอร์เน็ต (Data Saver)',
    data_saver_desc: 'ปิดการโหลดรูปภาพในหน้ารายการข่าวเพื่อประหยัด 3G/4G/5G และโหลดข่าวรวดเร็วขึ้น',
    ai_reader_title: 'โหมดอ่านแบบ AI (AI Smart Reader)',
    ai_reader_desc: 'แสดงสรุปประเด็นสำคัญและปุ่มอ่านออกเสียง AI ในหน้ารายละเอียดข่าว',

    // Section 6: Cloud Sync
    section_cloud: 'ระบบคลาวด์ (Supabase Cloud Sync)',
    section_cloud_sub: 'ซิงค์และสำรองข้อมูลบุ๊กมาร์กข้ามเครื่องอัตโนมัติ',
    cloud_enable_title: 'เปิดใช้งาน Supabase Cloud Sync',
    cloud_active_desc: 'กำลังซิงค์และสำรองข้อมูลบุ๊กมาร์กข้ามเครื่องอัตโนมัติ',
    cloud_disabled_desc: 'ปิดอยู่ (บันทึกบุ๊กมาร์กเฉพาะในเครื่องนี้)',
    cloud_connected: 'เชื่อมต่อกับ Supabase Cloud เรียบร้อย',
    cloud_secure_sub: 'ข้อมูลบุ๊กมาร์กจะถูกสำรองอย่างปลอดภัยโดยไม่ต้องล็อกอิน',
    device_id_label: 'รหัสประจำเครื่อง (Device ID):',
    share: 'แชร์',
    sync_cloud: 'ซิงค์ Cloud',
    connect_other_device: 'เชื่อมต่อเครื่องอื่น',
    checking: 'กำลังตรวจสอบ...',

    // Section 7: Storage & History
    section_storage: 'พื้นที่จัดเก็บและประวัติการใช้งาน',
    section_storage_sub: 'จัดการข้อมูลแคช ประวัติการอ่าน และคำค้นหา',
    metric_read: 'อ่านแล้ว',
    metric_search: 'คำค้นหา',
    metric_cache: 'แคชข่าว',
    metric_bookmarks: 'บันทึก',
    storage_read_title: 'ประวัติการอ่านข่าว',
    storage_read_has: '{count} ข่าวที่ทำเครื่องหมายอ่านแล้ว',
    storage_read_empty: 'ยังไม่มีประวัติการอ่าน',
    btn_reset: 'รีเซ็ต',
    storage_search_title: 'ประวัติการค้นหา',
    storage_search_has: '{count} คำค้นหาที่เคยพิมพ์ค้นไว้',
    storage_search_empty: 'ไม่มีประวัติค้นหา',
    btn_clear: 'ล้าง',
    storage_cache_title: 'แคชข่าวในเครื่อง',
    storage_cache_has: '{count} ข่าวที่โหลดเก็บไว้ในหน่วยความจำ',
    storage_cache_empty: 'ไม่มีแคช',
    btn_clear_cache: 'ล้างแคช',
    storage_bookmarks_title: 'ล้างข่าวที่บันทึกไว้ทั้งหมด',
    storage_bookmarks_cloud_sub: 'ลบ {count} ข่าวออกจากเครื่องและ Cloud',
    storage_bookmarks_local_sub: 'ลบ {count} ข่าวออกจากเครื่อง',
    storage_bookmarks_empty: 'ไม่มีบุ๊กมาร์ก',
    btn_delete_all: 'ลบทั้งหมด',

    // Section 8: Support & Legal
    section_support: 'ช่วยเหลือและข้อกำหนด (Support & Legal)',
    section_support_sub: 'ข้อเสนอแนะ นโยบายความเป็นส่วนตัว และช่องทางติดต่อ',
    feedback_menu: 'ส่งข้อเสนอแนะ / แจ้งข่าวมีปัญหา',
    rate_app_menu: 'ให้คะแนนแอปบน Google Play',
    contact_dev_menu: 'ติดต่อทีมงานผู้พัฒนา',
    privacy_menu: 'นโยบายความเป็นส่วนตัว (Privacy Policy)',
    terms_menu: 'ข้อกำหนดการใช้งาน (Terms of Service)',
    source_rss_menu: 'แหล่งข่าวต้นฉบับ Blognone RSS',

    // Feedback Modal
    feedback_modal_title: 'ส่งข้อเสนอแนะถึงผู้พัฒนา',
    feedback_modal_sub: 'ความคิดเห็นของคุณมีค่ามากในการพัฒนาแอปให้ดียิ่งขึ้น',
    feedback_cat_bug: 'แจ้งปัญหา',
    feedback_cat_suggest: 'เสนอแนะสำนักข่าว',
    feedback_cat_general: 'ข้อเสนอแนะทั่วไป',
    feedback_placeholder: 'พิมพ์ข้อความรายละเอียดที่ต้องการแจ้ง...',
    feedback_contact_label: 'อีเมลหรือเบอร์ติดต่อ (ไม่บังคับ):',
    feedback_contact_placeholder: 'เช่น name@example.com หรือ @line',
    btn_cancel: 'ยกเลิก',
    btn_submit: 'ส่งข้อเสนอแนะ',
    submitting: 'กำลังส่ง...',
    feedback_success_title: 'ส่งข้อมูลเรียบร้อย',
    feedback_success_msg: 'ขอบคุณสำหรับข้อเสนอแนะ ทีมงานได้รับข้อมูลแล้วครับ',
    feedback_alert_empty: 'กรุณาระบุรายละเอียดข้อความก่อนส่งครับ',

    // Link Device Modal
    modal_link_title: 'นำเข้าบุ๊กมาร์กจากเครื่องอื่น',
    modal_link_sub: 'กรอก Device ID ของเครื่องต้นทางเพื่อดึงรายการข่าวที่บันทึกไว้มายังเครื่องนี้',
    modal_link_label: 'Device ID ของเครื่องต้นทาง:',
    btn_import: 'ดึงข้อมูลเข้าเครื่อง',
    importing: 'กำลังดึงข้อมูล...',
    import_success_title: 'นำเข้าสำเร็จ',
    import_success_msg: 'ดึงข่าวที่บันทึกไว้เข้าเครื่องเรียบร้อยแล้ว {count} รายการ',

    // Common Alerts
    alert_notice: 'แจ้งเตือน',
    alert_enter_device_id: 'กรุณาระบุรหัสประจำเครื่อง (Device ID)',
    alert_error: 'เกิดข้อผิดพลาด',
    alert_success: 'สำเร็จ',
    alert_sync_success_title: 'ซิงค์ข้อมูลสำเร็จ',
    alert_sync_success_msg: 'เชื่อมต่อกับ Supabase Cloud เรียบร้อย ซิงค์บุ๊กมาร์กแล้ว {count} รายการ',
    alert_sync_fail_title: 'เชื่อมต่อขัดข้อง',
    alert_sync_fail_msg: 'ไม่สามารถเชื่อมต่อ Supabase ได้ในขณะนี้ กรุณาตรวจสอบอินเทอร์เน็ต',
    alert_confirm_reset_read: 'คุณต้องการรีเซ็ตสถานะการอ่านข่าวทั้งหมด ({count} ข่าว) ใช่หรือไม่?',
    alert_reset_read_success: 'ล้างประวัติการอ่านข่าวเรียบร้อยแล้ว',
    alert_confirm_clear_search: 'คุณต้องการลบคำค้นหาทั้งหมด ({count} คำ) ใช่หรือไม่?',
    alert_clear_search_success: 'ลบประวัติการค้นหาเรียบร้อยแล้ว',
    alert_clear_cache_success: 'ล้างแคชข่าวเรียบร้อยแล้ว',
    alert_confirm_delete_bookmarks: 'ข่าวที่บันทึกไว้ทั้งหมด ({count} ข่าว) จะถูกลบออกจากเครื่องและ Supabase Cloud ถาวรและไม่สามารถย้อนกลับได้',
    alert_confirm_delete_bookmarks_local: 'ข่าวที่บันทึกไว้ทั้งหมด ({count} ข่าว) จะถูกลบออกจากเครื่องถาวรและไม่สามารถย้อนกลับได้',
  },

  en: {
    // Navigation Bottom Tabs
    tab_latest: 'Latest',
    tab_categories: 'Categories',
    tab_search: 'Search',
    tab_bookmarks: 'Saved',
    tab_settings: 'Settings',

    // Settings Header & Brand Banner
    settings_title: 'Settings',
    brand_tagline: 'Stay updated with global tech and IT news',
    brand_footer: 'TechThaiNews v{version} • Designed for tech lovers',
    announcement_title: 'System Announcement',
    badge_status_ready: 'Ready',
    badge_quick_ai: 'AI Reader',
    badge_quick_cloud: 'Cloud Sync',
    badge_quick_lang: '2 Languages',

    // Group Categories
    group_display_lang: 'Display & Language',
    group_reading: 'Reading & Performance',
    group_sync_storage: 'Cloud & Storage',
    group_support_about: 'Support & About',

    // Section 1: Language
    section_language: 'App Language',
    section_language_sub: 'Choose Thai, English, or follow device language',
    lang_system: 'System',
    lang_th: 'ไทย',
    lang_en: 'English',
    lang_system_hint_th: 'Device: Thai',
    lang_system_hint_en: 'Device: English',

    // Section 2: Card Layout
    section_card_layout: 'News Card Layout',
    section_card_layout_sub: 'Choose your preferred news feed layout style',
    layout_compact: 'Compact',
    layout_compact_desc: 'Dense reading feed',
    layout_magazine: 'Magazine',
    layout_magazine_desc: 'Large featured photo',
    layout_grid: 'Grid',
    layout_grid_desc: '2-column layout',

    // Section 3: Appearance / Theme
    section_theme: 'App Appearance',
    section_theme_sub: 'Adjust color theme for comfortable viewing',
    theme_system: 'System',
    theme_system_desc: 'Auto match OS',
    theme_light: 'Light Clean',
    theme_light_desc: 'Crisp white paper',
    theme_dark: 'Slate Dark',
    theme_dark_desc: 'Comfortable navy',
    theme_midnight: 'Midnight',
    theme_midnight_desc: 'OLED pure black',
    theme_sepia: 'Warm Sepia',
    theme_sepia_desc: 'Eye-care paper',
    theme_tech: 'Cyber Tech',
    theme_tech_desc: 'Neon cobalt blue',

    // Section 4: Font Size
    section_font_size: 'Font Size (Typography)',
    section_font_size_sub: 'Adjust text size for comfortable reading',
    font_small: 'Small',
    font_medium: 'Medium',
    font_large: 'Large',
    preview_tag: 'Live Preview',
    preview_standard: 'standard scale',
    preview_headline: 'Google and Apple Announce New Standards for On-Device AI',
    preview_desc: 'On-device AI processing boosts performance by 40% while preserving user data privacy...',
    preview_meta: 'Blognone • 5 mins ago • 2 min read',

    // Section 5: Reading Experience & Links
    section_reading: 'Reading & Link Settings',
    section_reading_sub: 'Configure full article viewing preferences',
    link_channel_label: 'Open original article via:',
    link_in_app: 'In-App Browser',
    link_external: 'External Browser',
    data_saver_title: 'Data Saver Mode',
    data_saver_desc: 'Disable feed thumbnails to save mobile data and accelerate loading',
    ai_reader_title: 'AI Smart Reader Mode',
    ai_reader_desc: 'Show bullet points summary and AI speech player on article pages',

    // Section 6: Cloud Sync
    section_cloud: 'Cloud Backup & Sync',
    section_cloud_sub: 'Automatically sync bookmarks across your devices',
    cloud_enable_title: 'Enable Supabase Cloud Sync',
    cloud_active_desc: 'Automatically backing up and syncing bookmarks across devices',
    cloud_disabled_desc: 'Disabled (bookmarks stored on this device only)',
    cloud_connected: 'Connected to Supabase Cloud',
    cloud_secure_sub: 'Your bookmarks are safely backed up without requiring an account',
    device_id_label: 'Device ID:',
    share: 'Share',
    sync_cloud: 'Sync Cloud',
    connect_other_device: 'Link Device',
    checking: 'Checking...',

    // Section 7: Storage & History
    section_storage: 'Storage & History Management',
    section_storage_sub: 'Manage cached articles, reading history, and searches',
    metric_read: 'Read',
    metric_search: 'Searches',
    metric_cache: 'Cached',
    metric_bookmarks: 'Saved',
    storage_read_title: 'Reading History',
    storage_read_has: '{count} articles marked as read',
    storage_read_empty: 'No reading history yet',
    btn_reset: 'Reset',
    storage_search_title: 'Search History',
    storage_search_has: '{count} search queries stored',
    storage_search_empty: 'No search history',
    btn_clear: 'Clear',
    storage_cache_title: 'News Cache',
    storage_cache_has: '{count} articles cached locally',
    storage_cache_empty: 'No cache data',
    btn_clear_cache: 'Clear Cache',
    storage_bookmarks_title: 'Clear All Saved Bookmarks',
    storage_bookmarks_cloud_sub: 'Delete {count} bookmarks from device and Cloud',
    storage_bookmarks_local_sub: 'Delete {count} bookmarks from device',
    storage_bookmarks_empty: 'No bookmarks saved',
    btn_delete_all: 'Delete All',

    // Section 8: Support & Legal
    section_support: 'Support & Legal',
    section_support_sub: 'Feedback, privacy policy, and developer contact',
    feedback_menu: 'Send Feedback / Report an Issue',
    rate_app_menu: 'Rate App on Google Play',
    contact_dev_menu: 'Contact Development Team',
    privacy_menu: 'Privacy Policy',
    terms_menu: 'Terms of Service',
    source_rss_menu: 'Original RSS Source (Blognone)',

    // Feedback Modal
    feedback_modal_title: 'Send Feedback to Developers',
    feedback_modal_sub: 'Your feedback helps us make the app even better',
    feedback_cat_bug: 'Report Bug',
    feedback_cat_suggest: 'Suggest Source',
    feedback_cat_general: 'General',
    feedback_placeholder: 'Type your message or issue description here...',
    feedback_contact_label: 'Email or contact (Optional):',
    feedback_contact_placeholder: 'e.g. name@example.com',
    btn_cancel: 'Cancel',
    btn_submit: 'Submit Feedback',
    submitting: 'Submitting...',
    feedback_success_title: 'Feedback Sent',
    feedback_success_msg: 'Thank you! We have received your feedback.',
    feedback_alert_empty: 'Please enter a message before submitting.',

    // Link Device Modal
    modal_link_title: 'Import Bookmarks from Another Device',
    modal_link_sub: 'Enter the source Device ID to transfer saved bookmarks to this device',
    modal_link_label: 'Source Device ID:',
    btn_import: 'Import Data',
    importing: 'Importing...',
    import_success_title: 'Import Successful',
    import_success_msg: 'Successfully imported {count} saved articles',

    // Common Alerts
    alert_notice: 'Notice',
    alert_enter_device_id: 'Please provide a Device ID',
    alert_error: 'Error',
    alert_success: 'Success',
    alert_sync_success_title: 'Sync Successful',
    alert_sync_success_msg: 'Connected to Supabase Cloud. Synced {count} bookmarks.',
    alert_sync_fail_title: 'Connection Issue',
    alert_sync_fail_msg: 'Unable to connect to Supabase. Please check your internet connection.',
    alert_confirm_reset_read: 'Are you sure you want to reset reading status for all ({count}) articles?',
    alert_reset_read_success: 'Reading history has been reset successfully.',
    alert_confirm_clear_search: 'Are you sure you want to delete all ({count}) search queries?',
    alert_clear_search_success: 'Search history has been cleared successfully.',
    alert_clear_cache_success: 'News cache cleared successfully.',
    alert_confirm_delete_bookmarks: 'All ({count}) saved bookmarks will be permanently removed from this device and Cloud.',
    alert_confirm_delete_bookmarks_local: 'All ({count}) saved bookmarks will be permanently deleted from this device.',
  },
};

export type TranslationKey = keyof typeof translations.th;
