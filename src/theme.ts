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
  primary: '#1565C0', accent: '#00838F', background: '#F7F8FC',
  surface: '#FFFFFF', surfaceVariant: '#E9EDF5', text: '#1A1B20',
  muted: '#5D616B', border: '#D6DAE4', error: '#BA1A1A', onPrimary: '#FFFFFF',
};

export const darkColors: AppColors = {
  primary: '#8DB9FF', accent: '#79D7DF', background: '#111318',
  surface: '#1A1C22', surfaceVariant: '#272A32', text: '#E2E2E9',
  muted: '#C4C6D0', border: '#44474F', error: '#FFB4AB', onPrimary: '#002F65',
};

export const fontScale = { small: 0.88, medium: 1, large: 1.16 } as const;
