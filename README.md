# IT News App — React Native (Expo)

แอปพลิเคชันอ่านข่าวไอทีและเทคโนโลยี รองรับทั้งข่าวไทยและข่าวไอทีต่างประเทศ ดีไซน์พรีเมียม สไตล์ญี่ปุ่น (Japanese ITmedia / SmartNews Style) พร้อมระบบแยกแยะข่าวเก่า-ใหม่ และโหมดอ่านสรุปข่าวด้วย AI

---

## 🌟 ฟีเจอร์เด่น (Key Features)

### 1. แถบเมนูด้านข้างสไตล์ญี่ปุ่น (Japanese ITmedia Drawer Navigation)
- **แถบหัวบนสุด (Last Updated Top Bar)**: แสดงเวลาที่อัปเดตล่าสุด (`1 นาทีที่แล้ว`, `เมื่อสักครู่`) พร้อมปุ่มหมุนรีเฟรชข้อมูลทันที
- **แถบชิปกรองหมวดหมู่ (Category Filter Chips)**: เลือกดูช่องข่าวตามหมวดหมู่ได้อย่างรวดเร็ว (ทั้งหมด / ข่าวเทคโนโลยี / ข่าวต่างประเทศ / ข่าวไทย / ข่าวมือถือ / ข่าวคอมพิวเตอร์และเกม)
- **รายการช่องข่าวพร้อมแถบสีประจำหมวด (Color Stripe)**: แยกสีชัดเจนตามแต่ละหมวดหมู่ (น้ำเงิน, ฟ้า, บานเย็น, เขียว, ส้ม)
- **ระบบตัวนับและแจ้งเตือนข่าวใหม่ (Dynamic New Badge)**: แสดง Badge สีแดง `X ใหม่` และจุดไฟ `●` ข้างชื่อช่องข่าวที่มีข่าวใหม่อัปเดต
- **แถบเมนูลัดด้านล่าง (Bottom Quick Bar)**: ลิงก์ด่วนไปยังหน้าบันทึกข่าว, หน้าค้นหา, สลับโหมดมืด/สว่าง และหน้าการตั้งค่า
- **รองรับ Safe Area เต็มรูปแบบ**: ป้องกันปัญหาแถบนำทาง 3 ปุ่มของ Android (System Navigation Bar) บังเมนูด้านล่าง

### 2. แหล่งข่าวไอทีชั้นนำกว่า 47+ ช่องข่าว (5 หมวดหมู่หลัก)
- 💻 **ข่าวเทคโนโลยีและธุรกิจดิจิทัล**: Brand Inside, Blognone, Marketing Oops, ADPT News, Born to Dev, Techsauce, Beartai, TechTalkThai, Google Tech, Google AI, Google Cyber
- 🌐 **ข่าวไอทีต่างประเทศ**: TechCrunch, The Verge, Ars Technica, WIRED, Engadget, MIT Technology Review, 9to5Mac, 9to5Google, Android Authority, Android Police, MacRumors, Tom's Hardware, PCMag, ZDNET, VentureBeat, TechRadar
- 📰 **ข่าวสำนักข่าวไทย (In-App WebView)**: กรุงเทพธุรกิจ (Bangkok Biz), ฐานเศรษฐกิจ, TNN Thailand, Nation Thailand, PPTV HD 36, ไทยรัฐ, Sanook Hitech, Spring News, ผู้จัดการออนไลน์
- 📱 **ข่าวมือถือและอุปกรณ์**: Specphone, AppDisqus, Flashfly, iMoD, DroidSans, Google Android, Apple / iPhone
- 🎮 **ข่าวคอมพิวเตอร์และเกม**: NotebookSPEC, GamingDose, Extreme IT, Cloud / Data Center

### 3. รูปแบบการแสดงผลการ์ดข่าว 2 สไตล์ (Card Layout Switcher)
- **รูปแบบที่ 1: Compact View (รายการกะทัดรัด)**
  - รายการแนวนอนรูปย่อด้านขวา (106x76px)
  - แสดงหัวข้อและข้อมูลกระชับ อ่านข่าวได้จำนวนมากในหน้าเดียว
- **รูปแบบที่ 2: Magazine View (การ์ดรูปใหญ่)**
  - การ์ดรูปภาพใหญ่เต็มความกว้าง (ความสูง 180px)
  - ดีไซน์สวยหรู สไตล์นิตยสาร พร้อม Badge เวลาในการอ่าน (`อ่าน 2 นาที`)
- สลับรูปแบบได้สะดวกรวดเร็วทั้งจาก**ปุ่มไอคอนบนหัวหน้าข่าว** และใน**หน้าการตั้งค่า**

### 4. ระบบตรวจสอบข่าวเก่า vs ข่าวใหม่ พร้อม Highlight เด่นชัด
- ⚡ **ข่าวมาใหม่ล่าสุด (< 3 ชม.)**:
  - Badge สีแดงสด `⚡ ใหม่ล่าสุด`
  - ขอบ Highlight ด้านซ้ายหนา 5px สีแดง `#EF4444` พร้อมเหลือบแสงนวลตา
- 🔥 **ข่าวใหม่ที่ยังไม่อ่าน (< 24 ชม.)**:
  - Badge สีส้มสด `🔥 ข่าวใหม่`
  - ขอบ Highlight ด้านซ้ายหนา 4px สีส้ม `#F97316`
- ✓ **ข่าวที่อ่านแล้ว (Read Articles)**:
  - หัวข้อข่าวปรับเป็นสีเทาซอฟต์ลง ลดความเด่น (ความทึบ 78-80%)
  - แสดงแท็ก `✓ อ่านแล้ว` กำกับที่แถบข้อมูล
  - กดเปิดอ่านข่าวไหน สถานะจะเปลี่ยนเป็นอ่านแล้วทันที
- **แถบตัวกรองสถานะข่าว (Status Filter Bar)**:
  - `[ ทั้งหมด (X) ]` — แสดงข่าวทั้งหมดในช่อง
  - `[ 🔥 ข่าวใหม่ (Y) ]` — กรองแสดงเฉพาะข่าวใหม่ที่ยังไม่ได้เปิดอ่าน
  - `[ 📖 อ่านแล้ว (Z) ]` — กรองดูข่าวที่เคยอ่านไปแล้ว
- **แบนเนอร์แจ้งเตือนข่าวใหม่**: เมื่อดึงหน้ารีเฟรชแล้วพบข่าวใหม่เข้ามา จะมีแบนเนอร์แจ้งเตือน เช่น `⚡ พบข่าวใหม่มาเพิ่ม 3 ข่าว!` พร้อมปุ่ม **[ดูข่าวใหม่]**
- **ปุ่ม "อ่านหมด" (Mark All Read)**: กดเคลียร์สถานะทุกข่าวในช่องเป็นอ่านแล้วพร้อมกันในคลิกเดียว

### 5. โหมดอ่านข่าวแบบ AI (AI Smart Reader & AI Voice Reader)
- 🎯 **ใจความสำคัญ (One-line TL;DR)**: สรุปภาพรวมของข่าวใน 1-2 ประโยค เข้าใจได้ทันที
- 📌 **3-4 ประเด็นสำคัญที่ต้องรู้ (Key Takeaways)**: วิเคราะห์และเรียบเรียงเป็นข้อ 1, 2, 3, 4 ให้อ่านจับประเด็นได้ใน 30 วินาที
- 💡 **ดึงข้อมูลสำคัญอัตโนมัติ (Extracted Entities)**: สกัดราคา (เช่น `13,999 บาท`), กำหนดการ (เช่น `18-23 กันยายน`), สเปกเด่น (เช่น `5G`, `OLED`) ออกมาเป็นแท็กไฮไลต์
- 🎙️ **ระบบอ่านออกเสียงด้วยเสียง AI (AI Voice Reader)**:
  - มีปุ่มด่วน **"🎙️ ฟังเสียง AI"** และแถบเครื่องเล่นเสียง AI
  - ปุ่ม Play / Pause / Stop ควบคุมได้ตลอดเวลา
  - แอนิเมชันคลื่นเสียง (Wave Visualizer) เคลื่อนไหวขณะกำลังพูด
  - ปรับความเร็วเสียงอ่านได้ 3 ระดับ: `1.0x` | `1.25x` | `1.5x`
  - ตรวจจับภาษาอัตโนมัติ (ข่าวไทยอ่านภาษาไทย `th-TH`, ข่าวต่างประเทศอ่านภาษาอังกฤษ `en-US`)
  - หยุดเล่นเสียงอัตโนมัติเมื่อกดย้อนกลับออกจากหน้าข่าว
- **แท็บสลับโหมดการอ่าน**:
  - `[ ✨ โหมดอ่านแบบ AI ]` — ดูบทสรุปกระชับ + ประเด็นสำคัญ + เครื่องเล่นเสียง AI
  - `[ 📰 เนื้อหาข่าวต้นฉบับ ]` — ดูเนื้อหาข้อความเต็มตามต้นฉบับ
- ⚙️ **สวิตช์เปิด-ปิดโหมด AI ในหน้าการตั้งค่า**:
  - สามารถเปิดหรือปิดการทำงานของโหมด AI ได้ตามต้องการจากหน้าตั้งค่า หากปิดไว้ หน้าข่าวจะแสดงเฉพาะเนื้อหาข่าวแบบปกติ

### 6. การปรับแต่งและจัดการข้อมูล (Settings & Storage)
- **ธีม**: สว่าง (Light), มืด (Dark), หรือตามระบบ (System)
- **ขนาดตัวอักษร**: เล็ก (Small), กลาง (Medium), ใหญ่ (Large)
- **การจัดการข้อมูล**: ปุ่มล้างข่าวที่แคชไว้ และปุ่มล้างรายการข่าวที่บันทึกไว้
- บันทึกสถานะการอ่าน การตั้งค่า และบุ๊กมาร์กลง `AsyncStorage` ข้อมูลไม่สูญหายเมื่อปิดแอป

### 7. สถาปัตยกรรมระดับ Production & Worker Queue (Modular Architecture)
- **Modular Layer Architecture**:
  - `src/config/`: แยก `feeds.ts`, `categories.ts`, `constants.ts` ออกจากกันชัดเจน
  - `src/data/rss/`: แยกโมดูล `fetcher.ts`, `parser.ts`, `normalizer.ts`, `dedupe.ts`
  - `src/data/database/`: Data Access Layer สำหรับ AsyncStorage (`articles.ts`, `bookmarks.ts`, `history.ts`)
  - `src/services/`: Core Business Logic (`feedService.ts` พร้อมคิวโหลดข่าว, `aiService.ts`, `imageService.ts`, `speechService.ts`)
  - `src/hooks/`: Custom React Hooks (`useNews`, `useBookmarks`, `useTheme`, `useRefresh`)
- **Worker Queue พร้อม Concurrency Control**:
  - จำกัดการดึงข้อมูลพร้อมกันไม่เกิน 5 concurrent requests ป้องกัน Network/CPU Burst จาก 47+ ช่องข่าว
  - จัดคิวด้วยระบบ Priority Scheduler ให้ความสำคัญกับฟีดที่กำลังเปิดอยู่หน้าแรกสุด (Priority 0)
  - มี In-memory Cache ป้องกันการโหลดข้อมูลซ้ำซ้อน
- **Skeleton Shimmer Loading**: การ์ดแสดงผลขณะโหลดแบบ Shimmer Pulse ทั้งรูปแบบ Compact และ Magazine สวยงาม ลื่นไหล
- **Swipe Actions บนการ์ดข่าว**: ปัดขวาเพื่อทำเครื่องหมาย "อ่านแล้ว" และปัดซ้ายเพื่อ "บันทึกข่าว (Bookmark)" อย่างง่ายดาย
- **Enhanced Native Sharing**: ระบบแชร์ข่าวจัดฟอร์แมตสวยงาม พร้อมหัวข้อ, สำนักข่าว, เนื้อหาฉบับย่อ และลิงก์ต้นฉบับ
- **Thai Typography Optimization**: ปรับแต่ง Line Height และ Font Fallback สำหรับภาษาไทย (`Noto Sans Thai`, `Thonburi`, `Sukhumvit Set`) ป้องกันสระและวรรณยุกต์ลอยซ้อนทับหรือโดนตัด

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```
it_news_app/
├── android/                     # โฟลเดอร์ Native Android Project
├── src/
│   ├── components/              # คอมโพเนนต์ UI
│   │   ├── AiReaderCard.tsx     # การ์ดอ่านสรุปข่าว AI และเครื่องเล่นเสียง
│   │   ├── NewsCard.tsx         # การ์ดแสดงข่าว (Compact & Magazine) พร้อมระบบ Highlight & Swipe Actions
│   │   ├── SkeletonCard.tsx     # การ์ด Skeleton Shimmer Placeholder ขณะโหลดข่าว
│   │   └── ScreenState.tsx      # หน้าแสดงสถานะ Error / Empty
│   ├── config/                  # แหล่งข่าว หมวดหมู่ และค่าคงที่
│   │   ├── constants.ts         # คีย์ Storage, ค่า Limit, Timeout
│   │   ├── feeds.ts             # รายชื่อ 47 แหล่งข่าว
│   │   ├── categories.ts        # รายชื่อ 5 หมวดหมู่หลักและแถบสี
│   │   └── index.ts
│   ├── data/
│   │   ├── database/            # Data Access Layer (AsyncStorage)
│   │   │   ├── database.ts      # Storage Helper พื้นฐาน
│   │   │   ├── articles.ts      # แคชข่าวบทความ
│   │   │   ├── bookmarks.ts     # จัดการข่าวที่บันทึก
│   │   │   └── history.ts       # จัดการประวัติการค้นหา
│   │   └── rss/                 # ระบบดึงและแปลงข้อมูล RSS/Atom
│   │       ├── fetcher.ts       # Network Fetcher พร้อม Proxy Fallback
│   │       ├── parser.ts        # XML Parsing
│   │       ├── normalizer.ts    # Transform & Image Extraction
│   │       └── dedupe.ts        # Deduplication & Sorting
│   ├── hooks/                   # Custom Hooks
│   │   ├── useNews.ts           # เข้าถึงฟีดข่าวและสถานะการอ่าน
│   │   ├── useBookmarks.ts      # จัดการบันทึกข่าว
│   │   ├── useTheme.ts          # โหมดมืด/สว่าง และสีสัน
│   │   └── useRefresh.ts        # จัดการ Refresh State
│   ├── navigation/
│   │   └── RootNavigator.tsx    # Navigation สไตล์ญี่ปุ่น (Drawer + Tabs + Stack)
│   ├── screens/                 # หน้าจอต่าง ๆ
│   │   ├── ArticleDetailScreen.tsx # หน้ารายละเอียดข่าว + โหมดอ่าน AI + Native Sharing
│   │   ├── BookmarksScreen.tsx       # หน้ารายการข่าวที่บันทึกไว้
│   │   ├── LatestScreen.tsx          # หน้าฟีดข่าวล่าสุด + แถบกรองสถานะ + Skeleton
│   │   ├── SearchScreen.tsx          # หน้าค้นหาข่าวพร้อมประวัติการค้นหา
│   │   ├── SettingsScreen.tsx        # หน้าตั้งค่าธีม, ฟอนต์, เลย์เอาต์, สวิตช์ AI
│   │   └── WebViewScreen.tsx         # หน้าเปิดดูเว็บไซต์ข่าวต้นฉบับเต็ม
│   ├── services/                # Business Logic Services
│   │   ├── feedService.ts       # Queue Manager (Concurrency 5, Priority Scheduling)
│   │   ├── aiService.ts         # AI Summary & Entity Extractor Bridge
│   │   ├── imageService.ts      # Dynamic og:image Fetcher & Cache
│   │   └── speechService.ts     # Text-To-Speech Controller
│   ├── store/
│   │   └── NewsContext.tsx      # State Management (ประสานงาน Services & Repositories)
│   ├── theme/
│   │   └── index.ts             # โทนสี, Design Tokens & Thai Typography
│   ├── types.ts                 # TypeScript Type Definitions
│   └── utils/
│       ├── aiSummary.ts         # เอนจินวิเคราะห์และสรุปประเด็นข่าวอัจฉริยะ
│       ├── content.ts           # ตัวช่วยแปลงข้อความ HTML, เวลา, รูปภาพ
│       ├── share.ts             # ฟังก์ชันฟอร์แมตข้อความสำหรับ Native Share
│       └── speech.ts            # Dynamic Expo Speech Module Helper
├── App.tsx                      # Entry Point หลักของแอป
└── package.json
```

---

## 🛠️ เทคโนโลยีที่ใช้ (Tech Stack)

- **Framework**: React Native 0.86, Expo SDK 57
- **Language**: TypeScript 6
- **Navigation**: React Navigation 7 (Drawer, Bottom Tabs, Native Stack)
- **UI & Icons**: Vanilla StyleSheet, `@expo/vector-icons` (MaterialCommunityIcons)
- **Data Parsing**: `fast-xml-parser`, `he`
- **Storage**: `@react-native-async-storage/async-storage`
- **Safe Area**: `react-native-safe-area-context`
- **Web & Speech**: `react-native-webview`, safe dynamic `expo-speech`

---

## 🚀 การติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. รันแอปพลิเคชันบน Android

```bash
npm run android
```

### 3. รันผ่าน Expo CLI

```bash
npm start
```

### 4. ตรวจสอบความถูกต้องของ Type (TypeScript Check)

```bash
npm run typecheck
```
