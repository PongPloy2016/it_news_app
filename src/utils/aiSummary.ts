import { stripHtml } from './content';

export interface AiSummaryResult {
  tldr: string;
  keyPoints: string[];
  keyTags: string[];
  speechScript: string;
  readingTimeSec: number;
}

/**
 * Detects if content contains Thai language
 */
export function isThaiText(text: string): boolean {
  return /[\u0E00-\u0E7F]/.test(text);
}

/**
 * Extracts key numbers, prices, or dates from news text
 */
function extractKeyTags(text: string): string[] {
  const tags: string[] = [];

  // 1. Match prices (e.g. 13,999 บาท, $999, 50,000 เยน, ฿15,000)
  const priceMatches = text.match(/(?:ราคา|เริ่มต้น)?\s*(?:฿|\$)?\s*[\d,]+(?:\.\d+)?\s*(?:บาท|ดอลลาร์|USD|THB|\$|เยน)/gi);
  if (priceMatches) {
    for (const p of priceMatches.slice(0, 2)) {
      const clean = p.trim().replace(/^ราคา/, '').trim();
      if (!tags.includes(clean)) tags.push(clean);
    }
  }

  // 2. Match dates (e.g. 18-23 กันยายน, วันที่ 25 ต.ค., 2026, Q3)
  const dateMatches = text.match(/\b\d{1,2}(?:\s*-\s*\d{1,2})?\s*(?:มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)(?:\s*\d{2,4})?/gi);
  if (dateMatches) {
    for (const d of dateMatches.slice(0, 2)) {
      const clean = d.trim();
      if (!tags.includes(clean)) tags.push(clean);
    }
  }

  // 3. Match specs or tech terms (e.g. 5G, AI, OLED, Snapdragon, M4, 120Hz, 5000mAh, 12GB RAM)
  const specMatches = text.match(/\b(5G|AI|OLED|AMOLED|Snapdragon(?:\s*\w+)?|Apple Intelligence|iOS\s*\d+|Android\s*\d+|\d+Hz|\d+mAh|\d+GB\s*RAM|4K|Wi-Fi\s*\d+)\b/gi);
  if (specMatches) {
    for (const s of specMatches.slice(0, 3)) {
      const clean = s.trim();
      if (!tags.includes(clean)) tags.push(clean);
    }
  }

  return tags.slice(0, 4);
}

/**
 * Cleans boilerplate text from RSS feeds (e.g. "[...] The post appeared first on...")
 */
function cleanNewsContent(raw: string): string {
  let text = stripHtml(raw);
  // remove WordPress / feed boilerplates
  text = text.replace(/\[\.\.\.\]/g, ' ');
  text = text.replace(/The post .+ appeared first on .+/gi, '');
  text = text.replace(/appeared first on .+/gi, '');
  text = text.replace(/อ่านเพิ่มเติมได้ที่ .+/gi, '');
  text = text.replace(/อ่านต่อที่ .+/gi, '');
  text = text.replace(/source: .+/gi, '');
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Intelligent summarization engine that splits and extracts key insights
 */
export function generateAiSummary(title: string, rawContent?: string): AiSummaryResult {
  const content = cleanNewsContent(rawContent || '');
  const combined = `${title}. ${content}`.trim();
  const isThai = isThaiText(title);

  // Extract key tags (price, specs, dates)
  const keyTags = extractKeyTags(combined);

  // Split into sentences / meaningful chunks
  const rawSentences = combined
    .split(/(?<=[.!?\n])\s+|\s+(?:โดย|ซึ่ง|พร้อม|ทั้งนี้|นอกจากนี้|สำหรับ|รวมถึง)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 15);

  const sentences = rawSentences.length > 0 ? rawSentences : [title];

  // 1. One-line TL;DR
  let tldr = '';
  if (isThai) {
    if (content.length > 30) {
      tldr = `${title} — ${sentences[1] ? sentences[1] : content.slice(0, 110)}...`;
    } else {
      tldr = `${title} ข่าวสารเทคโนโลยีล่าสุด`;
    }
  } else {
    tldr = sentences.length > 1 ? `${sentences[0]} ${sentences[1]}` : title;
  }

  // 2. Generate 3-4 Key Points
  const keyPoints: string[] = [];

  // Point 1: Core news headline focus
  keyPoints.push(
    isThai
      ? `หัวข้อหลัก: ${title}`
      : `Core update: ${title}`
  );

  // Point 2: Main detail / specs / offer
  if (keyTags.length > 0) {
    keyPoints.push(
      isThai
        ? `ไฮไลต์สำคัญ: มีข้อมูลเด่นระบุ ${keyTags.join(' • ')}`
        : `Key Highlights: Features ${keyTags.join(' • ')}`
    );
  } else if (sentences[1]) {
    keyPoints.push(sentences[1]);
  }

  // Point 3: Additional context or summary
  const extraSentence = sentences.find(
    (s, idx) => idx >= 2 && s.length > 20 && !keyPoints.includes(s)
  );
  if (extraSentence) {
    keyPoints.push(extraSentence);
  } else if (content.length > 40) {
    keyPoints.push(
      isThai
        ? `รายละเอียด: ${content.slice(0, 100)}...`
        : `Details: ${content.slice(0, 120)}...`
    );
  }

  // Point 4: Action / availability
  if (combined.includes('จอง') || combined.includes('วางจำหน่าย') || combined.includes('เปิดตัว') || combined.includes('launch') || combined.includes('order')) {
    keyPoints.push(
      isThai
        ? 'สถานะ: ประกาศเปิดตัวและเปิดสั่งจองแล้ว สามารถตรวจสอบรายละเอียดเพิ่มเติมได้ในข่าวฉบับเต็ม'
        : 'Status: Officially announced. Full details and availability can be viewed in the source.'
    );
  }

  // 3. Generate natural speech script for AI TTS
  const speechParts: string[] = [];
  if (isThai) {
    speechParts.push(`สรุปข่าวโดย เอไอ.`);
    speechParts.push(title + '.');
    if (keyTags.length > 0) {
      speechParts.push(`จุดเด่นสำคัญ ได้แก่ ${keyTags.join(', ')}.`);
    }
    if (content.length > 20) {
      speechParts.push(content.slice(0, 180) + '.');
    }
  } else {
    speechParts.push(`AI News Summary.`);
    speechParts.push(title + '.');
    if (keyTags.length > 0) {
      speechParts.push(`Key highlights include ${keyTags.join(', ')}.`);
    }
    if (content.length > 20) {
      speechParts.push(content.slice(0, 200) + '.');
    }
  }

  const speechScript = speechParts.join(' ');
  const wordCount = speechScript.split(/\s+/).length;
  const readingTimeSec = Math.max(15, Math.ceil((wordCount / 130) * 60));

  return {
    tldr,
    keyPoints: keyPoints.slice(0, 4),
    keyTags,
    speechScript,
    readingTimeSec,
  };
}
