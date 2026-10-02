import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BLOGNONE_HOME, FEED_URL } from '../config';
import { submitAppFeedback } from '../services/appSettingsService';
import { useNews } from '../store/NewsContext';
import { CardLayoutOption, FontSizeOption, ThemeMode } from '../types';

const themeOptions: Array<[ThemeMode, string]> = [
  ['system', 'ตามระบบ'],
  ['light', 'สว่าง'],
  ['dark', 'มืด'],
];
const fontOptions: Array<[FontSizeOption, string]> = [
  ['small', 'เล็ก'],
  ['medium', 'กลาง'],
  ['large', 'ใหญ่'],
];

const layoutOptions: Array<[CardLayoutOption, string, string, keyof typeof MaterialCommunityIcons.glyphMap]> = [
  ['compact', 'รายการกะทัดรัด (รูปที่ 1)', 'รูปย่อด้านขวา อ่านข่าวได้หลายข่าว', 'view-headline'],
  ['magazine', 'การ์ดรูปใหญ่ (รูปที่ 2)', 'รูปใหญ่เต็มความกว้าง สวยเด่นคมชัด', 'view-agenda-outline'],
];

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    settings,
    remoteSettings,
    colors,
    scale,
    isDark,
    setThemeMode,
    setFontSize,
    setCardLayout,
    setAiReaderEnabled,
    clearNewsCache,
    clearBookmarks,
  } = useNews();

  // Feedback Modal State
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggest_feed' | 'general'>('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณาระบุรายละเอียดข้อความก่อนส่งครับ');
      return;
    }

    setIsSubmitting(true);
    const result = await submitAppFeedback({
      category: feedbackCategory,
      message: feedbackMessage.trim(),
      contact: feedbackContact.trim() || undefined,
      app_version: remoteSettings.latest_version || '1.0.0',
      device_platform: Platform.OS,
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsFeedbackModalVisible(false);
      setFeedbackMessage('');
      setFeedbackContact('');
      Alert.alert('สำเร็จ', 'ขอบคุณสำหรับข้อเสนอแนะ ทีมงานได้รับข้อมูลเรียบร้อยแล้วครับ');
    } else {
      Alert.alert('เกิดข้อผิดพลาด', result.error || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const RadioRow = ({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) => (
    <Pressable onPress={onPress} style={styles.radioRow}>
      <MaterialCommunityIcons
        name={selected ? 'radiobox-marked' : 'radiobox-blank'}
        size={23}
        color={selected ? colors.primary : colors.muted}
      />
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
      {/* 1. Global Announcement Banner (Controlled from Supabase) */}
      {remoteSettings.announcement_active && remoteSettings.announcement_message && (
        <View style={[styles.announcementCard, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: '#3B82F6' }]}>
          <MaterialCommunityIcons name="bullhorn-outline" size={22} color="#3B82F6" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.announcementTitle, { color: isDark ? '#93C5FD' : '#1D4ED8', fontSize: 14 * scale }]}>
              ประกาศจากระบบ
            </Text>
            <Text style={[styles.announcementDesc, { color: isDark ? '#E2E8F0' : '#1E3A8A', fontSize: 13 * scale }]}>
              {remoteSettings.announcement_message}
            </Text>
          </View>
        </View>
      )}

      {/* 2. News Card Layout */}
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
              <View style={styles.layoutTextWrap}>
                <Text style={[styles.layoutTitle, { color: colors.text, fontSize: 14 * scale }]}>
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

      {/* 3. AI Feature Switch (Only visible when enabled remotely via Supabase) */}
      {remoteSettings.is_ai_enabled && (
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

      {/* 4. Theme Options */}
      <Section title="ธีม">
        {themeOptions.map(([value, label]) => (
          <RadioRow
            key={value}
            label={label}
            selected={settings.themeMode === value}
            onPress={() => setThemeMode(value)}
          />
        ))}
      </Section>

      {/* 5. Font Size Options */}
      <Section title="ขนาดตัวอักษร">
        {fontOptions.map(([value, label]) => (
          <RadioRow
            key={value}
            label={label}
            selected={settings.fontSize === value}
            onPress={() => setFontSize(value)}
          />
        ))}
      </Section>

      {/* 6. Data Management */}
      <Section title="การจัดการข้อมูล">
        <Pressable
          onPress={() => void clearNewsCache()}
          style={[styles.outlineButton, { borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="delete-sweep-outline" size={21} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text, fontSize: 14 * scale }]}>ล้างข่าวที่แคชไว้</Text>
        </Pressable>
        <Pressable
          onPress={() =>
            Alert.alert(
              'ล้างข่าวที่บันทึกไว้?',
              'ข่าวที่บันทึกไว้ทั้งหมดจะถูกลบและไม่สามารถย้อนกลับได้',
              [
                { text: 'ยกเลิก', style: 'cancel' },
                { text: 'ลบทั้งหมด', style: 'destructive', onPress: clearBookmarks },
              ],
            )
          }
          style={[styles.outlineButton, { borderColor: colors.error }]}
        >
          <MaterialCommunityIcons name="bookmark-remove-outline" size={21} color={colors.error} />
          <Text style={[styles.buttonText, { color: colors.error, fontSize: 14 * scale }]}>
            ล้างข่าวที่บันทึกไว้
          </Text>
        </Pressable>
      </Section>

      {/* 7. Support, Feedback & Legal Policies (Connected to Supabase) */}
      <Section title="ช่วยเหลือและข้อกำหนด (Support & Legal)">
        <Pressable
          onPress={() => setIsFeedbackModalVisible(true)}
          style={[styles.linkRow, { borderBottomColor: colors.border }]}
        >
          <View style={styles.linkLeft}>
            <MaterialCommunityIcons name="message-alert-outline" size={20} color={colors.primary} />
            <Text style={[styles.linkTitle, { color: colors.text, fontSize: 14 * scale }]}>
              ส่งข้อเสนอแนะ / แจ้งข่าวมีปัญหา
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
        </Pressable>

        {remoteSettings.play_store_url && (
          <Pressable
            onPress={() => void Linking.openURL(remoteSettings.play_store_url!)}
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons name="star-outline" size={20} color="#F59E0B" />
              <Text style={[styles.linkTitle, { color: colors.text, fontSize: 14 * scale }]}>
                ให้คะแนนแอปบน Google Play
              </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
          </Pressable>
        )}

        {remoteSettings.support_email && (
          <Pressable
            onPress={() => void Linking.openURL(`mailto:${remoteSettings.support_email}`)}
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.primary} />
              <Text style={[styles.linkTitle, { color: colors.text, fontSize: 14 * scale }]}>
                ติดต่อทีมงาน ({remoteSettings.support_email})
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>
        )}

        {remoteSettings.privacy_policy_url && (
          <Pressable
            onPress={() => void Linking.openURL(remoteSettings.privacy_policy_url!)}
            style={[styles.linkRow, { borderBottomColor: colors.border }]}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color="#10B981" />
              <Text style={[styles.linkTitle, { color: colors.text, fontSize: 14 * scale }]}>
                นโยบายความเป็นส่วนตัว (Privacy Policy)
              </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
          </Pressable>
        )}

        {remoteSettings.terms_url && (
          <Pressable
            onPress={() => void Linking.openURL(remoteSettings.terms_url!)}
            style={styles.linkRow}
          >
            <View style={styles.linkLeft}>
              <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.muted} />
              <Text style={[styles.linkTitle, { color: colors.text, fontSize: 14 * scale }]}>
                ข้อกำหนดการใช้งาน (Terms of Service)
              </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={18} color={colors.muted} />
          </Pressable>
        )}
      </Section>

      {/* 8. About & Version */}
      <Section title="เกี่ยวกับ">
        <Text style={[styles.caption, { color: colors.muted, fontSize: 12 * scale }]}>แหล่งข่าวหลัก (RSS)</Text>
        <Text selectable style={[styles.feedUrl, { color: colors.primary, fontSize: 13 * scale }]}>
          {FEED_URL}
        </Text>
        <Text style={[styles.about, { color: colors.muted, fontSize: 14 * scale }]}>
          เนื้อหาและข่าวต้นฉบับจาก Blognone และแหล่งข่าวไอทีชั้นนำในไทย
        </Text>
        <Pressable
          onPress={() => void Linking.openURL(BLOGNONE_HOME)}
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>เยี่ยมชม Blognone</Text>
        </Pressable>

        <View style={styles.versionFooter}>
          <Text style={[styles.versionText, { color: colors.muted, fontSize: 12 * scale }]}>
            TechThaiNews เวอร์ชัน {remoteSettings.latest_version || '1.0.0'}
          </Text>
        </View>
      </Section>

      {/* Feedback Modal */}
      <Modal
        visible={isFeedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>ส่งข้อเสนอแนะ / แจ้งปัญหา</Text>
              <Pressable hitSlop={8} onPress={() => setIsFeedbackModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            {/* Category selection */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>หมวดหมู่</Text>
            <View style={styles.categoryRow}>
              {(
                [
                  ['general', 'ข้อเสนอแนะ'],
                  ['bug', 'แจ้งปัญหา/ข่าวเสีย'],
                  ['suggest_feed', 'แนะนำฟีดข่าว'],
                ] as const
              ).map(([catKey, catLabel]) => (
                <Pressable
                  key={catKey}
                  onPress={() => setFeedbackCategory(catKey)}
                  style={[
                    styles.categoryChip,
                    feedbackCategory === catKey && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                    feedbackCategory !== catKey && { borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      { color: feedbackCategory === catKey ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {catLabel}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Message input */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>รายละเอียด *</Text>
            <TextInput
              style={[
                styles.textArea,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              multiline
              numberOfLines={4}
              placeholder="ระบุข้อความหรือปัญหาที่พบ..."
              placeholderTextColor={colors.muted}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
            />

            {/* Contact input */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>ข้อมูลติดต่อกลับ (อีเมล ไม่บังคับ)</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              placeholder="example@gmail.com"
              placeholderTextColor={colors.muted}
              value={feedbackContact}
              onChangeText={setFeedbackContact}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Submit button */}
            <Pressable
              disabled={isSubmitting}
              onPress={() => void handleSubmitFeedback()}
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary, marginTop: 18 },
                isSubmitting && { opacity: 0.6 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>ส่งข้อมูลไปยัง Supabase</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
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
  serverBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  serverBadgeText: {
    fontWeight: '600',
  },
  announcementCard: {
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 14,
  },
  announcementTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  announcementDesc: {
    lineHeight: 19,
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
  layoutTitle: {
    fontWeight: '700',
  },
  layoutTextWrap: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  layoutDesc: {
    marginTop: 2,
  },
  outlineButton: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 9,
    padding: 12,
  },
  buttonText: { fontWeight: '700', marginLeft: 8 },
  linkRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  linkLeft: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  linkTitle: {
    fontWeight: '600',
  },
  caption: { marginBottom: 4 },
  feedUrl: { lineHeight: 19 },
  about: { marginTop: 14 },
  primaryButton: { alignItems: 'center', borderRadius: 12, marginTop: 16, padding: 13 },
  primaryButtonText: { fontWeight: '800' },
  versionFooter: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 10,
  },
  versionText: {
    fontWeight: '500',
  },
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 20,
    paddingBottom: 36,
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 88,
    padding: 12,
    textAlignVertical: 'top',
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    padding: 12,
  },
});
