import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { styles } from '../styles';
import { SectionProps } from '../types';

interface ComponentSectionProps extends SectionProps {
  isDark: boolean;
  colors: any;
  scale: number;
}

export function Section({
  icon,
  gradientColors,
  title,
  subtitle,
  children,
  isDark,
  colors,
  scale,
}: ComponentSectionProps) {
  return (
    <View
      style={[
        styles.sectionContainer,
        {
          backgroundColor: isDark ? '#141722' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        },
      ]}
    >
      <View style={styles.sectionHeaderRow}>
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sectionIconBadge}
        >
          <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitleText, { color: colors.text, fontSize: 15 * scale }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.sectionSubtitleText, { color: colors.muted, fontSize: 12 * scale }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}
