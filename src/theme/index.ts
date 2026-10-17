import { Platform } from 'react-native';

export interface AppColors {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  text: string;
  muted: string;
  border: string;
  error: string;
  onPrimary: string;
}

export const lightColors: AppColors = {
  primary: '#1565C0',
  accent: '#00838F',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceVariant: '#E9EDF5',
  text: '#1A1B20',
  muted: '#5D616B',
  border: '#D6DAE4',
  error: '#BA1A1A',
  onPrimary: '#FFFFFF',
};

export const darkColors: AppColors = {
  primary: '#8DB9FF',
  accent: '#79D7DF',
  background: '#111318',
  surface: '#1A1C22',
  surfaceVariant: '#272A32',
  text: '#E2E2E9',
  muted: '#C4C6D0',
  border: '#44474F',
  error: '#FFB4AB',
  onPrimary: '#002F65',
};

export const midnightColors: AppColors = {
  primary: '#38BDF8',
  accent: '#818CF8',
  background: '#000000',
  surface: '#0B0D13',
  surfaceVariant: '#151821',
  text: '#F8FAFC',
  muted: '#94A3B8',
  border: '#242834',
  error: '#F87171',
  onPrimary: '#000000',
};

export const sepiaColors: AppColors = {
  primary: '#B45309',
  accent: '#D97706',
  background: '#FAF4E8',
  surface: '#FFFDF9',
  surfaceVariant: '#F3E8D3',
  text: '#382A1C',
  muted: '#7A6B5B',
  border: '#E8DBC3',
  error: '#DC2626',
  onPrimary: '#FFFFFF',
};

export const techColors: AppColors = {
  primary: '#06B6D4',
  accent: '#3B82F6',
  background: '#070D19',
  surface: '#0F172A',
  surfaceVariant: '#1E293B',
  text: '#F1F5F9',
  muted: '#94A3B8',
  border: '#1E293B',
  error: '#F87171',
  onPrimary: '#001E2B',
};

export const fontScale = { small: 0.88, medium: 1, large: 1.16 } as const;

/**
 * Optimized Typography for Thai + English bilingual reading
 * Thai vowels require slightly taller line heights (1.5x - 1.6x)
 */
export const typography = {
  fontFamily: Platform.select({
    ios: 'Thonburi, Sukhumvit Set, Noto Sans Thai, system-ui, sans-serif',
    android: 'sans-serif, Noto Sans Thai',
    default: 'Noto Sans Thai, sans-serif',
  }),
  title: {
    lineHeightMultiplier: 1.45,
    letterSpacing: -0.2,
  },
  body: {
    lineHeightMultiplier: 1.6,
    letterSpacing: 0.1,
  },
  meta: {
    lineHeightMultiplier: 1.4,
    letterSpacing: 0,
  },
};
