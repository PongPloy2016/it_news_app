import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNews } from '../store/NewsContext';

interface Props {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ScreenState({ icon, title, subtitle, actionLabel, onAction }: Props) {
  const { colors, scale } = useNews();
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={58} color={colors.primary} />
      <Text style={[styles.title, { color: colors.text, fontSize: 19 * scale }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted, fontSize: 14 * scale }]}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={({ pressed }) => [
          styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 },
        ]}>
          <Text style={[styles.buttonText, { color: colors.onPrimary, fontSize: 14 * scale }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontWeight: '700', marginTop: 16, textAlign: 'center' },
  subtitle: { lineHeight: 21, marginTop: 8, textAlign: 'center' },
  button: { borderRadius: 24, marginTop: 20, paddingHorizontal: 22, paddingVertical: 12 },
  buttonText: { fontWeight: '700' },
});
