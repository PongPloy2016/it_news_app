import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BLOGNONE_HOME, FEED_URL } from '../config';
import { useNews } from '../store/NewsContext';
import { FontSizeOption, ThemeMode } from '../types';

const themeOptions: Array<[ThemeMode, string]> = [
  ['system', 'ตามระบบ'], ['light', 'สว่าง'], ['dark', 'มืด'],
];
const fontOptions: Array<[FontSizeOption, string]> = [
  ['small', 'เล็ก'], ['medium', 'กลาง'], ['large', 'ใหญ่'],
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings, colors, scale, setThemeMode, setFontSize, clearNewsCache, clearBookmarks,
  } = useNews();

  const RadioRow = ({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={styles.radioRow}>
      <MaterialCommunityIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={23} color={selected ? colors.primary : colors.muted} />
      <Text style={[styles.radioLabel, { color: colors.text, fontSize: 15 * scale }]}>{label}</Text>
    </Pressable>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: 15 * scale }]}>{title}</Text>
      {children}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]}>
      <Section title="ธีม">
        {themeOptions.map(([value, label]) => <RadioRow key={value} label={label}
          selected={settings.themeMode === value} onPress={() => setThemeMode(value)} />)}
      </Section>
      <Section title="ขนาดตัวอักษร">
        {fontOptions.map(([value, label]) => <RadioRow key={value} label={label}
          selected={settings.fontSize === value} onPress={() => setFontSize(value)} />)}
      </Section>
      <Section title="การจัดการข้อมูล">
        <Pressable onPress={() => void clearNewsCache()} style={[styles.outlineButton, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="delete-sweep-outline" size={21} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text, fontSize: 14 * scale }]}>ล้างข่าวที่แคชไว้</Text>
        </Pressable>
        <Pressable onPress={() => Alert.alert('ล้างข่าวที่บันทึกไว้?',
          'ข่าวที่บันทึกไว้ทั้งหมดจะถูกลบและไม่สามารถย้อนกลับได้', [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'ลบทั้งหมด', style: 'destructive', onPress: clearBookmarks },
          ])} style={[styles.outlineButton, { borderColor: colors.error }]}>
          <MaterialCommunityIcons name="bookmark-remove-outline" size={21} color={colors.error} />
          <Text style={[styles.buttonText, { color: colors.error, fontSize: 14 * scale }]}>ล้างข่าวที่บันทึกไว้</Text>
        </Pressable>
      </Section>
      <Section title="เกี่ยวกับ">
        <Text style={[styles.caption, { color: colors.muted, fontSize: 12 * scale }]}>แหล่งข่าว (RSS)</Text>
        <Text selectable style={[styles.feedUrl, { color: colors.primary, fontSize: 13 * scale }]}>{FEED_URL}</Text>
        <Text style={[styles.about, { color: colors.muted, fontSize: 14 * scale }]}>เนื้อหาและข่าวต้นฉบับจาก Blognone</Text>
        <Pressable onPress={() => void Linking.openURL(BLOGNONE_HOME)}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>เยี่ยมชม Blognone</Text>
        </Pressable>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14, padding: 16, paddingBottom: 96 },
  section: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  sectionTitle: { fontWeight: '800', marginBottom: 8 },
  radioRow: { alignItems: 'center', flexDirection: 'row', minHeight: 44 },
  radioLabel: { marginLeft: 12 },
  outlineButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 9, padding: 12 },
  buttonText: { fontWeight: '700', marginLeft: 8 },
  caption: { marginBottom: 4 },
  feedUrl: { lineHeight: 19 },
  about: { marginTop: 14 },
  primaryButton: { alignItems: 'center', borderRadius: 12, marginTop: 16, padding: 13 },
  primaryButtonText: { fontWeight: '800' },
});
