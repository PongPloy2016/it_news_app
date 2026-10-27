import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface CategoryI18nData {
  label: string;
  shortLabel: string;
  tagline: string;
}

export interface CategoryMetadata {
  key: string;
  color: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  image: string;
  order_index: number;
  is_active: boolean;
  th: CategoryI18nData;
  en: CategoryI18nData;
}

export interface CategoryVisual {
  image: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  shortLabel: string;
  tagline: string;
  label?: string;
  label_th?: string;
  label_en?: string;
  short_th?: string;
  short_en?: string;
}

/**
 * All 25 standard categories with bilingual metadata (TH / EN)
 * Colors and active status strictly match the user specification
 */
export const CATEGORY_DEFINITIONS: Record<string, CategoryMetadata> = {
  // #1
  'tech-business': {
    key: 'tech-business',
    color: '#2F6FED',
    icon: 'laptop',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&auto=format&fit=crop&q=80',
    order_index: 1,
    is_active: true,
    th: {
      label: 'ข่าวเทคโนโลยีและธุรกิจดิจิทัล',
      shortLabel: 'เทคโนโลยี & ธุรกิจ',
      tagline: 'ธุรกิจ ไอที ดิจิทัล และสตาร์ทอัป',
    },
    en: {
      label: 'Tech & Digital Business',
      shortLabel: 'Tech & Business',
      tagline: 'Business, IT, digital trends & startups',
    },
  },

  // #2
  international: {
    key: 'international',
    color: '#0284C7',
    icon: 'earth',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&auto=format&fit=crop&q=80',
    order_index: 2,
    is_active: true,
    th: {
      label: 'ข่าวไอทีต่างประเทศ',
      shortLabel: 'ไอทีต่างประเทศ',
      tagline: 'ข่าวสารนวัตกรรมและเทคโนโลยีระดับโลก',
    },
    en: {
      label: 'Global Tech News',
      shortLabel: 'Global Tech',
      tagline: 'Worldwide tech innovations & breakthroughs',
    },
  },

  // #3
  'thai-news': {
    key: 'thai-news',
    color: '#D946EF',
    icon: 'newspaper',
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700&auto=format&fit=crop&q=80',
    order_index: 3,
    is_active: true,
    th: {
      label: 'ข่าวสำนักข่าวไทย',
      shortLabel: 'สำนักข่าวไทย',
      tagline: 'ข่าวสารทันเหตุการณ์จากสำนักข่าวชั้นนำ',
    },
    en: {
      label: 'Thai News Agencies',
      shortLabel: 'Thai News',
      tagline: 'Breaking updates from top Thai agencies',
    },
  },

  // #4
  mobile: {
    key: 'mobile',
    color: '#17A673',
    icon: 'cellphone',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
    order_index: 4,
    is_active: false,
    th: {
      label: 'ข่าวมือถือและอุปกรณ์',
      shortLabel: 'มือถือ & อุปกรณ์',
      tagline: 'สมาร์ทโฟน แท็บเล็ต และแกดเจ็ตใหม่',
    },
    en: {
      label: 'Mobile & Gadgets',
      shortLabel: 'Mobile',
      tagline: 'Smartphones, tablets & newest gadgets',
    },
  },

  // #5
  'computer-games': {
    key: 'computer-games',
    color: '#F59E0B',
    icon: 'gamepad-variant',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=80',
    order_index: 5,
    is_active: false,
    th: {
      label: 'ข่าวคอมพิวเตอร์และเกม',
      shortLabel: 'คอมพิวเตอร์ & เกม',
      tagline: 'ฮาร์ดแวร์ พีซี วงการเกม และอีสปอร์ต',
    },
    en: {
      label: 'Computer & Gaming',
      shortLabel: 'PC & Gaming',
      tagline: 'PC hardware, games & esports',
    },
  },

  // #6
  'ai-innovation': {
    key: 'ai-innovation',
    color: '#8B5CF6',
    icon: 'robot',
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=700&auto=format&fit=crop&q=80',
    order_index: 6,
    is_active: false,
    th: {
      label: 'ปัญญาประดิษฐ์และ AI',
      shortLabel: 'AI & ปัญญาประดิษฐ์',
      tagline: 'นวัตกรรม AI โมเดลภาษา และเทคโนโลยีอัจฉริยะ',
    },
    en: {
      label: 'AI & Innovation',
      shortLabel: 'AI & Tech',
      tagline: 'AI models, intelligent tools & robotics',
    },
  },

  // #7
  'weather-forecast': {
    key: 'weather-forecast',
    color: '#0284C7',
    icon: 'weather-partly-cloudy',
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=700&auto=format&fit=crop&q=80',
    order_index: 7,
    is_active: true,
    th: {
      label: 'สภาพอากาศและฟ้าฝน',
      shortLabel: 'สภาพอากาศ & ฟ้าฝน',
      tagline: 'พยากรณ์อากาศและรายงานฝนฟ้า',
    },
    en: {
      label: 'Weather & Forecast',
      shortLabel: 'Weather',
      tagline: 'Daily weather forecast & storm alerts',
    },
  },

  // #8
  cybersecurity: {
    key: 'cybersecurity',
    color: '#EF4444',
    icon: 'shield-alert',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=700&auto=format&fit=crop&q=80',
    order_index: 8,
    is_active: true,
    th: {
      label: 'ความปลอดภัยไซเบอร์และเตือนภัย',
      shortLabel: 'ความปลอดภัยไซเบอร์',
      tagline: 'เตือนภัยไซเบอร์ ความมั่นคงปลอดภัย และแฮกเกอร์',
    },
    en: {
      label: 'Cybersecurity & Alerts',
      shortLabel: 'Cybersecurity',
      tagline: 'Online safety alerts, vulnerabilities & scams',
    },
  },

  // #9
  'ev-vehicles': {
    key: 'ev-vehicles',
    color: '#10B981',
    icon: 'car-electric',
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=700&auto=format&fit=crop&q=80',
    order_index: 9,
    is_active: false,
    th: {
      label: 'ยานยนต์ไฟฟ้าและเทคโนโลยี EV',
      shortLabel: 'ยานยนต์ไฟฟ้า EV',
      tagline: 'รถยนต์ไฟฟ้า แบตเตอรี่ และเทคโนโลยียานยนต์',
    },
    en: {
      label: 'EV & Automotive Tech',
      shortLabel: 'EV & Auto',
      tagline: 'Electric vehicles, batteries & auto mobility',
    },
  },

  // #10
  'science-space': {
    key: 'science-space',
    color: '#6366F1',
    icon: 'telescope',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=80',
    order_index: 10,
    is_active: false,
    th: {
      label: 'วิทยาศาสตร์และสำรวจอวกาศ',
      shortLabel: 'วิทยาศาสตร์ & อวกาศ',
      tagline: 'การค้นพบทางวิทยาศาสตร์และภารกิจสำรวจอวกาศ',
    },
    en: {
      label: 'Science & Space',
      shortLabel: 'Science',
      tagline: 'Scientific discoveries & outer space missions',
    },
  },

  // #11
  'fintech-crypto': {
    key: 'fintech-crypto',
    color: '#F59E0B',
    icon: 'bitcoin',
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=700&auto=format&fit=crop&q=80',
    order_index: 11,
    is_active: false,
    th: {
      label: 'การเงินดิจิทัลและบล็อกเชน',
      shortLabel: 'การเงิน & Crypto',
      tagline: 'บล็อกเชน คริปโทเคอร์เรนซี และฟินเทค',
    },
    en: {
      label: 'Fintech & Blockchain',
      shortLabel: 'Fintech & Crypto',
      tagline: 'Digital assets, cryptocurrency & fintech',
    },
  },

  // #12
  'developer-coding': {
    key: 'developer-coding',
    color: '#06B6D4',
    icon: 'code-tags',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&auto=format&fit=crop&q=80',
    order_index: 12,
    is_active: false,
    th: {
      label: 'โปรแกรมมิ่งและนักพัฒนา',
      shortLabel: 'โปรแกรมมิ่ง & Dev',
      tagline: 'เทคนิคการเขียนโค้ด เครื่องมือนักพัฒนา',
    },
    en: {
      label: 'Programming & Developers',
      shortLabel: 'Coding & Dev',
      tagline: 'Coding practices, engineering & developer tools',
    },
  },

  // #13
  agriculture: {
    key: 'agriculture',
    color: '#16a34a',
    icon: 'sprout',
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=700&auto=format&fit=crop&q=80',
    order_index: 13,
    is_active: true,
    th: {
      label: 'ข่าวเกษตร',
      shortLabel: 'ข่าวเกษตร',
      tagline: 'ข่าวสารการเกษตร เทคโนโลยีการเพาะปลูก',
    },
    en: {
      label: 'Agriculture News',
      shortLabel: 'Agriculture',
      tagline: 'Smart farming, agritech & agriculture news',
    },
  },

  // #14
  education: {
    key: 'education',
    color: '#7c3aed',
    icon: 'school',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=700&auto=format&fit=crop&q=80',
    order_index: 14,
    is_active: false,
    th: {
      label: 'ข่าวการศึกษา',
      shortLabel: 'การศึกษา',
      tagline: 'การศึกษา ทุนการศึกษา และการเรียนรู้',
    },
    en: {
      label: 'Education News',
      shortLabel: 'Education',
      tagline: 'Schools, universities & educational news',
    },
  },

  // #15
  'economy-business': {
    key: 'economy-business',
    color: '#d97706',
    icon: 'chart-line',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=700&auto=format&fit=crop&q=80',
    order_index: 15,
    is_active: true,
    th: {
      label: 'ข่าวเศรษฐกิจ ธุรกิจ การตลาด',
      shortLabel: 'เศรษฐกิจ & ธุรกิจ',
      tagline: 'เศรษฐกิจ ตลาดหุ้น ธุรกิจ และการตลาด',
    },
    en: {
      label: 'Economy & Business',
      shortLabel: 'Economy',
      tagline: 'Markets, finance, economy & trade',
    },
  },

  // #16
  'health-medical': {
    key: 'health-medical',
    color: '#e11d48',
    icon: 'heart-pulse',
    image: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=700&auto=format&fit=crop&q=80',
    order_index: 16,
    is_active: false,
    th: {
      label: 'ข่าวสุขภาพและการแพทย์',
      shortLabel: 'สุขภาพ & การแพทย์',
      tagline: 'สุขภาพ นวัตกรรมทางการแพทย์ และการดูแลตนเอง',
    },
    en: {
      label: 'Health & Medicine',
      shortLabel: 'Health',
      tagline: 'Medical wellness, healthcare & wellness tips',
    },
  },

  // #17
  'jobs-careers': {
    key: 'jobs-careers',
    color: '#0891b2',
    icon: 'briefcase',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=700&auto=format&fit=crop&q=80',
    order_index: 17,
    is_active: false,
    th: {
      label: 'ข่าวงานและสมัครงาน',
      shortLabel: 'งาน & สมัครงาน',
      tagline: 'ตำแหน่งงาน อบรมวิชาชีพ และเทรนด์การทำงาน',
    },
    en: {
      label: 'Jobs & Careers',
      shortLabel: 'Jobs',
      tagline: 'Job openings, careers & recruitment',
    },
  },

  // #18
  sports: {
    key: 'sports',
    color: '#ea580c',
    icon: 'soccer',
    image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=700&auto=format&fit=crop&q=80',
    order_index: 18,
    is_active: true,
    th: {
      label: 'ข่าวกีฬา',
      shortLabel: 'ข่าวกีฬา',
      tagline: 'ฟุตบอล วงการกีฬาไทย และต่างประเทศ',
    },
    en: {
      label: 'Sports News',
      shortLabel: 'Sports',
      tagline: 'Football, leagues & athletic competitions',
    },
  },

  // #19
  'travel-tourism': {
    key: 'travel-tourism',
    color: '#0d9488',
    icon: 'airplane',
    image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=700&auto=format&fit=crop&q=80',
    order_index: 19,
    is_active: true,
    th: {
      label: 'ข่าวท่องเที่ยว',
      shortLabel: 'ข่าวท่องเที่ยว',
      tagline: 'แหล่งท่องเที่ยว ที่พัก และโปรโมชั่นเดินทาง',
    },
    en: {
      label: 'Travel & Tourism',
      shortLabel: 'Travel',
      tagline: 'Travel destinations, hotels & guides',
    },
  },

  // #20
  entertainment: {
    key: 'entertainment',
    color: '#db2777',
    icon: 'movie-open',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=700&auto=format&fit=crop&q=80',
    order_index: 20,
    is_active: false,
    th: {
      label: 'ข่าวบันเทิง',
      shortLabel: 'ข่าวบันเทิง',
      tagline: 'ดารา บันเทิง ซีรีส์ และภาพยนตร์',
    },
    en: {
      label: 'Entertainment News',
      shortLabel: 'Entertainment',
      tagline: 'Celebrities, movies, drama & pop culture',
    },
  },

  // #21
  'environment-energy': {
    key: 'environment-energy',
    color: '#65a30d',
    icon: 'leaf',
    image: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=700&auto=format&fit=crop&q=80',
    order_index: 21,
    is_active: false,
    th: {
      label: 'ข่าวสิ่งแวดล้อมและพลังงาน',
      shortLabel: 'สิ่งแวดล้อม & พลังงาน',
      tagline: 'สิ่งแวดล้อม พลังงานสะอาด และภาวะโลกร้อน',
    },
    en: {
      label: 'Environment & Energy',
      shortLabel: 'Environment',
      tagline: 'Clean energy, climate action & green living',
    },
  },

  // #22
  politics: {
    key: 'politics',
    color: '#dc2626',
    icon: 'bank',
    image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=700&auto=format&fit=crop&q=80',
    order_index: 22,
    is_active: false,
    th: {
      label: 'ข่าวการเมือง',
      shortLabel: 'ข่าวการเมือง',
      tagline: 'ประเด็นการเมือง นโยบายรัฐ และเหตุการณ์สำคัญ',
    },
    en: {
      label: 'Politics News',
      shortLabel: 'Politics',
      tagline: 'Government policy, civic affairs & politics',
    },
  },

  // #23
  'real-estate': {
    key: 'real-estate',
    color: '#9333ea',
    icon: 'home-city',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=700&auto=format&fit=crop&q=80',
    order_index: 23,
    is_active: false,
    th: {
      label: 'ข่าวอสังหาริมทรัพย์',
      shortLabel: 'อสังหาริมทรัพย์',
      tagline: 'บ้าน คอนโด ที่ดิน และการลงทุนอสังหาฯ',
    },
    en: {
      label: 'Real Estate News',
      shortLabel: 'Real Estate',
      tagline: 'Housing, condos, property market & investment',
    },
  },

  // #24
  transport: {
    key: 'transport',
    color: '#2563eb',
    icon: 'train-car',
    image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=700&auto=format&fit=crop&q=80',
    order_index: 24,
    is_active: false,
    th: {
      label: 'ข่าวคมนาคมและขนส่ง',
      shortLabel: 'คมนาคม & ขนส่ง',
      tagline: 'รถไฟฟ้า ทางด่วน การบิน และระบบโลจิสติกส์',
    },
    en: {
      label: 'Transport & Logistics',
      shortLabel: 'Transport',
      tagline: 'Mass transit, railways, flights & logistics',
    },
  },

  // #25
  hot: {
    key: 'hot',
    color: '#ed6031',
    icon: 'fire',
    image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=700&auto=format&fit=crop&q=80',
    order_index: 25,
    is_active: true,
    th: {
      label: 'ข่าวทั่วไป',
      shortLabel: 'ข่าวทั่วไป',
      tagline: 'ประเด็นเด่น กระแสสังคม และข่าวประจำวัน',
    },
    en: {
      label: 'General News',
      shortLabel: 'General',
      tagline: 'Trending topics, society & daily stories',
    },
  },

  // Special alias: 'weather' -> same as 'weather-forecast'
  weather: {
    key: 'weather',
    color: '#0284C7',
    icon: 'weather-partly-cloudy',
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=700&auto=format&fit=crop&q=80',
    order_index: 7,
    is_active: true,
    th: {
      label: 'สภาพอากาศและฟ้าฝน',
      shortLabel: 'สภาพอากาศ & ฟ้าฝน',
      tagline: 'พยากรณ์อากาศและรายงานฝนฟ้า',
    },
    en: {
      label: 'Weather & Forecast',
      shortLabel: 'Weather',
      tagline: 'Daily weather forecast & storm alerts',
    },
  },
};

export const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
  image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=80',
  icon: 'folder-outline',
  color: '#6366F1',
  shortLabel: 'ทั่วไป',
  tagline: 'ข่าวสารและบทความน่าสนใจ',
  label: 'ข่าวทั่วไป',
};

/**
 * Get full title for a category by key and language ('th' | 'en')
 */
export function getCategoryTitle(
  key: string,
  lang: 'th' | 'en' = 'th',
  fallback?: string,
): string {
  const def = CATEGORY_DEFINITIONS[key];
  if (def) {
    return lang === 'en' ? def.en.label : def.th.label;
  }
  return fallback || key;
}

/**
 * Get short label (for tabs, pills, and compact buttons) by key and language ('th' | 'en')
 */
export function getCategoryShortLabel(
  key: string,
  lang: 'th' | 'en' = 'th',
  fallback?: string,
): string {
  if (key === 'all') {
    return lang === 'en' ? 'All' : 'รวมทุกหมวด';
  }
  const def = CATEGORY_DEFINITIONS[key];
  if (def) {
    return lang === 'en' ? def.en.shortLabel : def.th.shortLabel;
  }
  if (fallback) {
    return fallback.replace(/^ข่าว/, '');
  }
  return key;
}

/**
 * Get tagline description for category header
 */
export function getCategoryTagline(
  key: string,
  lang: 'th' | 'en' = 'th',
  fallback?: string,
): string {
  const def = CATEGORY_DEFINITIONS[key];
  if (def) {
    return lang === 'en' ? def.en.tagline : def.th.tagline;
  }
  return fallback || DEFAULT_CATEGORY_VISUAL.tagline;
}

/**
 * Get visual presentation data (image, icon, color, shortLabel, tagline) for a category
 */
export function getCategoryVisual(
  key: string,
  label?: string,
  color?: string,
  lang: 'th' | 'en' = 'th',
): CategoryVisual {
  if (key === 'all') {
    return {
      image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=700&auto=format&fit=crop&q=80',
      icon: 'layers-triple',
      color: color || '#0EA5E9',
      shortLabel: lang === 'en' ? 'All' : 'รวมทุกหมวด',
      tagline: lang === 'en' ? 'All categories in one place' : 'รวมทุกหมวดหมู่ข่าวสารในที่เดียว',
      label: lang === 'en' ? 'All Categories' : 'รวมทุกหมวดหมู่',
      label_th: 'รวมทุกหมวดหมู่',
      label_en: 'All Categories',
      short_th: 'รวมทุกหมวด',
      short_en: 'All',
    };
  }

  const def = CATEGORY_DEFINITIONS[key];
  if (def) {
    const i18n = lang === 'en' ? def.en : def.th;
    return {
      image: def.image,
      icon: def.icon,
      color: color || def.color,
      shortLabel: i18n.shortLabel,
      tagline: i18n.tagline,
      label: i18n.label,
      label_th: def.th.label,
      label_en: def.en.label,
      short_th: def.th.shortLabel,
      short_en: def.en.shortLabel,
    };
  }

  return {
    ...DEFAULT_CATEGORY_VISUAL,
    color: color || DEFAULT_CATEGORY_VISUAL.color,
    shortLabel: label ? label.replace(/^ข่าว/, '') : DEFAULT_CATEGORY_VISUAL.shortLabel,
    label: label || DEFAULT_CATEGORY_VISUAL.label,
  };
}

/**
 * Export legacy record for backward compatibility
 */
export const CATEGORY_VISUALS: Record<string, CategoryVisual> = Object.keys(
  CATEGORY_DEFINITIONS,
).reduce<Record<string, CategoryVisual>>((acc, key) => {
  acc[key] = getCategoryVisual(key, undefined, undefined, 'th');
  return acc;
}, {});
