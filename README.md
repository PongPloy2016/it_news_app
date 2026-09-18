# Blognone News — React Native

เวอร์ชัน React Native/Expo ที่ย้ายมาจากแอป Android Jetpack Compose ในโฟลเดอร์หลัก

## เริ่มใช้งาน

```bash
npm install
npm run android
```

หรือสแกน QR code จาก `npm start` ด้วย Expo Go ที่รองรับ SDK 57

## ตรวจสอบโค้ด

```bash
npm run typecheck
npx expo-doctor
```

ตั้งค่า RSS feed อื่นได้โดยคัดลอก `.env.example` เป็น `.env` แล้วแก้ค่า
`EXPO_PUBLIC_RSS_FEED_URL` หากรันบนเว็บและติด CORS สามารถกำหนด
`EXPO_PUBLIC_RSS_PROXY_URL` โดยใช้ `{url}` เป็นตำแหน่ง URL ที่ encode แล้วได้
