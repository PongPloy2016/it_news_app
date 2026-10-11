import { MaterialCommunityIcons } from '@expo/vector-icons';

export interface CategoryVisual {
  image: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  shortLabel: string;
  tagline: string;
}

export const CATEGORY_VISUALS: Record<string, CategoryVisual> = {
  'tech-business': {
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&auto=format&fit=crop&q=80',
    icon: 'laptop',
    color: '#2F6FED',
    shortLabel: 'เทคโนโลยี & ธุรกิจ',
    tagline: 'ธุรกิจ ไอที ดิจิทัล และสตาร์ทอัป',
  },
  'international': {
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&auto=format&fit=crop&q=80',
    icon: 'earth',
    color: '#0284C7',
    shortLabel: 'ไอทีต่างประเทศ',
    tagline: 'ข่าวสารนวัตกรรมและเทคโนโลยีระดับโลก',
  },
  'thai-news': {
    image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=700&auto=format&fit=crop&q=80',
    icon: 'newspaper',
    color: '#D946EF',
    shortLabel: 'สำนักข่าวไทย',
    tagline: 'ข่าวสารทันเหตุการณ์จากสำนักข่าวชั้นนำ',
  },
  'mobile': {
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=700&auto=format&fit=crop&q=80',
    icon: 'cellphone',
    color: '#17A673',
    shortLabel: 'มือถือ & อุปกรณ์',
    tagline: 'สมาร์ทโฟน แท็บเล็ต และแกดเจ็ตใหม่',
  },
  'computer-games': {
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=700&auto=format&fit=crop&q=80',
    icon: 'gamepad-variant',
    color: '#F59E0B',
    shortLabel: 'คอมพิวเตอร์ & เกม',
    tagline: 'ฮาร์ดแวร์ พีซี วงการเกม และอีสปอร์ต',
  },
  'weather-forecast': {
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=700&auto=format&fit=crop&q=80',
    icon: 'weather-partly-cloudy',
    color: '#0284C7',
    shortLabel: 'สภาพอากาศ & ฟ้าฝน',
    tagline: 'พยากรณ์อากาศและรายงานฝนฟ้า',
  },
  'weather': {
    image: 'https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=700&auto=format&fit=crop&q=80',
    icon: 'weather-partly-cloudy',
    color: '#0EA5E9',
    shortLabel: 'สภาพอากาศ',
    tagline: 'พยากรณ์อากาศและรายงานฝนฟ้า',
  },
  'cybersecurity': {
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=700&auto=format&fit=crop&q=80',
    icon: 'shield-alert',
    color: '#EF4444',
    shortLabel: 'ความปลอดภัยไซเบอร์',
    tagline: 'เตือนภัยไซเบอร์ ความมั่นคงปลอดภัย และแฮกเกอร์',
  },
  'agriculture': {
    image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=700&auto=format&fit=crop&q=80',
    icon: 'sprout',
    color: '#84CC16',
    shortLabel: 'ข่าวเกษตร',
    tagline: 'ข่าวสารการเกษตร เทคโนโลยีการเพาะปลูก',
  },
  'ai-innovation': {
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=700&auto=format&fit=crop&q=80',
    icon: 'robot',
    color: '#8B5CF6',
    shortLabel: 'AI & ปัญญาประดิษฐ์',
    tagline: 'นวัตกรรม AI โมเดลภาษา และเทคโนโลยีอัจฉริยะ',
  },
  'ev-vehicles': {
    image: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?w=700&auto=format&fit=crop&q=80',
    icon: 'car-electric',
    color: '#10B981',
    shortLabel: 'ยานยนต์ไฟฟ้า EV',
    tagline: 'รถยนต์ไฟฟ้า แบตเตอรี่ และเทคโนโลยียานยนต์',
  },
  'science-space': {
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=80',
    icon: 'telescope',
    color: '#6366F1',
    shortLabel: 'วิทยาศาสตร์ & อวกาศ',
    tagline: 'การค้นพบทางวิทยาศาสตร์และภารกิจสำรวจอวกาศ',
  },
  'fintech-crypto': {
    image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=700&auto=format&fit=crop&q=80',
    icon: 'bitcoin',
    color: '#F59E0B',
    shortLabel: 'การเงิน & Crypto',
    tagline: 'บล็อกเชน คริปโทเคอร์เรนซี และฟินเทค',
  },
  'developer-coding': {
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=700&auto=format&fit=crop&q=80',
    icon: 'code-tags',
    color: '#06B6D4',
    shortLabel: 'โปรแกรมมิ่ง & Dev',
    tagline: 'เทคนิคการเขียนโค้ด เครื่องมือนักพัฒนา',
  },
};

export const DEFAULT_CATEGORY_VISUAL: CategoryVisual = {
  image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&auto=format&fit=crop&q=80',
  icon: 'folder-outline',
  color: '#6366F1',
  shortLabel: 'ทั่วไป',
  tagline: 'ข่าวสารและบทความน่าสนใจ',
};

export function getCategoryVisual(key: string, label?: string, color?: string): CategoryVisual {
  const visual = CATEGORY_VISUALS[key];
  if (visual) {
    return {
      ...visual,
      color: color || visual.color,
      shortLabel: visual.shortLabel || label || visual.shortLabel,
    };
  }

  return {
    ...DEFAULT_CATEGORY_VISUAL,
    color: color || DEFAULT_CATEGORY_VISUAL.color,
    shortLabel: label || DEFAULT_CATEGORY_VISUAL.shortLabel,
  };
}
