import { MaterialCommunityIcons } from '@expo/vector-icons';

export const withAlpha = (hex: string, alpha: number): string => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const GROUP_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  all: 'view-dashboard-outline',
  'tech-business': 'laptop',
  international: 'earth',
  'thai-news': 'newspaper',
  mobile: 'cellphone',
  'computer-games': 'gamepad-variant',
  'ai-innovation': 'robot',
  'weather-forecast': 'weather-partly-cloudy',
  weather: 'weather-partly-cloudy',
  cybersecurity: 'shield-alert',
  'ev-vehicles': 'car-electric',
  'science-space': 'telescope',
  'fintech-crypto': 'bitcoin',
  'developer-coding': 'code-tags',
  agriculture: 'sprout',
  education: 'school',
  'economy-business': 'chart-line',
  'health-medical': 'heart-pulse',
  'jobs-careers': 'briefcase',
  sports: 'soccer',
  'travel-tourism': 'airplane',
  entertainment: 'movie-open',
  'environment-energy': 'leaf',
  politics: 'bank',
  'real-estate': 'home-city',
  transport: 'train-car',
  hot: 'fire',
};

export const PAGE_SIZE = 10;
