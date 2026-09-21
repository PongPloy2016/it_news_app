import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BLOGNONE_HOME, FEED_URL } from '../config';
import { useNews } from '../store/NewsContext';
import { CardLayoutOption, FontSizeOption, ThemeMode } from '../types';

const themeOptions: Array<[ThemeMode, string]> = [
  ['system', 'ตามระบบ'], ['light', 'สว่าง'], ['dark', 'มืด'],
];
const fontOptions: Array<[FontSizeOption, string]> = [
  ['small', 'เล็ก'], ['medium', 'กลาง'], ['large', 'ใหญ่'],
];

const layoutOptions: Array<[CardLayoutOption, string, string, keyof typeof MaterialCommunityIcons.glyphMap]> = [
  ['compact', 'รายการกะทัดรัด (รูปที่ 1)', 'รูปย่อด้านขวา อ่านข่าวได้หลายข่าว', 'view-headline'],
  ['magazine', 'การ์ดรูปใหญ่ (รูปที่ 2)', 'รูปใหญ่เต็มความกว้าง สวยเด่นคมชัด', 'view-agenda-outline'],
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings, colors, scale, setThemeMode, setFontSize, setCardLayout, setAiReaderEnabled, clearNewsCache, clearBookmarks,
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
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: 150 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      <Section title="รูปแบบการแสดงผลข่าว">
        {layoutOptions.map(([value, label, desc, icon]) => {
          const isSelected = settings.cardLayout === value;
          return (
            <Pressable
              key={value}
              onPress={() => setCardLayout(value)}
              style={[
                styles.layoutRow,
                {
                  backgroundColor: isSelected ? colors.surfaceVariant : 'transparent',
                  borderColor: isSelected ? colors.primary : 'transparent',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                size={23}
                color={isSelected ? colors.primary : colors.muted}
              />
              <View style={styles.layoutTextWrap}>
                <Text
                  style={[
                    styles.radioLabel,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontSize: 15 * scale,
                      fontWeight: isSelected ? '700' : '500',
                      marginLeft: 0,
                    },
                  ]}
                >
                  {label}
                </Text>
                <Text style={[styles.layoutDesc, { color: colors.muted, fontSize: 12 * scale }]}>
                  {desc}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={icon}
                size={24}
                color={isSelected ? colors.primary : colors.muted}
              />
            </Pressable>
          );
        })}
      </Section>

      {/* ซ่อนฟีเจอร์ AI ในหน้าตั้งค่าชั่วคราว */}
      {false && (
        <Section title="ฟีเจอร์ AI (AI Features)">
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="creation" size={19} color="#6366F1" />
                <Text style={[styles.switchTitle, { color: colors.text, fontSize: 15 * scale }]}>
                  โหมดอ่านแบบ AI (AI Smart Reader)
                </Text>
              </View>
              <Text style={[styles.switchDesc, { color: colors.muted, fontSize: 12 * scale }]}>
                แสดงบทสรุปประเด็นสำคัญและระบบอ่านออกเสียง AI ในหน้ารายละเอียดข่าว
              </Text>
            </View>
            <Switch
              value={settings.aiReaderEnabled}
              onValueChange={setAiReaderEnabled}
              trackColor={{ false: colors.border, true: '#6366F1' }}
              thumbColor={settings.aiReaderEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>
        </Section>
      )}

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
  content: { gap: 14, padding: 16 },
  section: { borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  sectionTitle: { fontWeight: '800', marginBottom: 8 },
  radioRow: { alignItems: 'center', flexDirection: 'row', minHeight: 44 },
  radioLabel: { marginLeft: 12 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  switchTitle: {
    fontWeight: '700',
  },
  switchDesc: {
    lineHeight: 18,
    marginTop: 4,
  },
  layoutRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  layoutTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  layoutDesc: {
    marginTop: 2,
  },
  outlineButton: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', marginTop: 9, padding: 12 },
  buttonText: { fontWeight: '700', marginLeft: 8 },
  caption: { marginBottom: 4 },
  feedUrl: { lineHeight: 19 },
  about: { marginTop: 14 },
  primaryButton: { alignItems: 'center', borderRadius: 12, marginTop: 16, padding: 13 },
  primaryButtonText: { fontWeight: '800' },
});
