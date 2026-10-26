import { Text, View } from 'react-native';
import { styles } from '../styles';

interface CategoryGroupHeaderProps {
  title: string;
  color: string;
  scale: number;
  isDark: boolean;
}

export function CategoryGroupHeader({
  title,
  color,
  scale,
  isDark,
}: CategoryGroupHeaderProps) {
  return (
    <View style={styles.groupHeaderWrap}>
      <View style={[styles.groupHeaderDot, { backgroundColor: color }]} />
      <Text style={[styles.groupHeaderText, { color, fontSize: 11.5 * scale }]}>
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.groupHeaderLine,
          {
            backgroundColor: isDark
              ? 'rgba(255, 255, 255, 0.07)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      />
    </View>
  );
}
