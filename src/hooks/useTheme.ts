import { useNews } from '../store/NewsContext';

export function useTheme() {
  const { colors, isDark, scale, settings, setThemeMode, setFontSize } = useNews();

  return {
    colors,
    isDark,
    scale,
    themeMode: settings.themeMode,
    fontSize: settings.fontSize,
    setThemeMode,
    setFontSize,
  };
}

export default useTheme;
