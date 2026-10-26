import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { BLOGNONE_HOME, FEED_URL } from '../../../config';
import { styles } from '../styles';
import { SettingsViewModel } from '../types';
import { CategoryGroupHeader } from './CategoryGroupHeader';
import { Section } from './Section';

interface SupportSectionProps {
  vm: SettingsViewModel;
}

export function SupportSection({ vm }: SupportSectionProps) {
  const {
    colors,
    scale,
    isDark,
    remoteSettings,
    setIsFeedbackModalVisible,
    t,
  } = vm;

  return (
    <>
      {/* Category Group Header */}
      <CategoryGroupHeader
        title={t.group_support_about}
        color="#6366F1"
        scale={scale}
        isDark={isDark}
      />

      {/* Section 8: ช่วยเหลือและข้อกำหนด (Support & Legal) */}
      <Section
        icon="shield-check-outline"
        gradientColors={['#6366F1', '#4F46E5']}
        title={t.section_support}
        subtitle={t.section_support_sub}
        isDark={isDark}
        colors={colors}
        scale={scale}
      >
        <View style={styles.linkListWrap}>
          {/* Feedback Modal trigger */}
          <Pressable
            onPress={() => setIsFeedbackModalVisible(true)}
            style={[styles.linkRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
          >
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linkItemIcon}
            >
              <MaterialCommunityIcons name="message-draw" size={17} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
              {t.feedback_menu}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
          </Pressable>

          {/* Rate App on Play Store */}
          {remoteSettings.play_store_url && (
            <Pressable
              onPress={() => void Linking.openURL(remoteSettings.play_store_url!)}
              style={[styles.linkRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkItemIcon}
              >
                <MaterialCommunityIcons name="star" size={17} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.rate_app_menu}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.muted} />
            </Pressable>
          )}

          {/* Contact Email */}
          {remoteSettings.support_email && (
            <Pressable
              onPress={() => void Linking.openURL(`mailto:${remoteSettings.support_email}`)}
              style={[styles.linkRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
            >
              <LinearGradient
                colors={['#0284C7', '#0369A1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkItemIcon}
              >
                <MaterialCommunityIcons name="email-outline" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
                  {t.contact_dev_menu}
                </Text>
                <Text style={[styles.linkItemSub, { color: colors.muted, fontSize: 11 * scale }]}>
                  {remoteSettings.support_email}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.muted} />
            </Pressable>
          )}

          {/* Privacy Policy */}
          {remoteSettings.privacy_policy_url && (
            <Pressable
              onPress={() => void Linking.openURL(remoteSettings.privacy_policy_url!)}
              style={[styles.linkRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkItemIcon}
              >
                <MaterialCommunityIcons name="shield-check-outline" size={17} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.privacy_menu}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.muted} />
            </Pressable>
          )}

          {/* Terms of Service */}
          {remoteSettings.terms_url && (
            <Pressable
              onPress={() => void Linking.openURL(remoteSettings.terms_url!)}
              style={[styles.linkRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
            >
              <LinearGradient
                colors={['#6366F1', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkItemIcon}
              >
                <MaterialCommunityIcons name="file-document-outline" size={17} color="#FFFFFF" />
              </LinearGradient>
              <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.terms_menu}
              </Text>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.muted} />
            </Pressable>
          )}

          {/* Main RSS Source Info (Dynamically configured) */}
          <Pressable
            onPress={() => void Linking.openURL(remoteSettings.rss_source_url || BLOGNONE_HOME)}
            style={[styles.linkRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border, borderBottomWidth: remoteSettings.contact_custom_url ? StyleSheet.hairlineWidth : 0 }]}
          >
            <LinearGradient
              colors={['#F97316', '#EA580C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.linkItemIcon}
            >
              <MaterialCommunityIcons name="rss" size={17} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.source_rss_menu}
              </Text>
              <Text style={[styles.linkItemSub, { color: colors.muted, fontSize: 11 * scale }]}>
                {remoteSettings.rss_source_url || FEED_URL}
              </Text>
            </View>
            <MaterialCommunityIcons name="open-in-new" size={16} color={colors.muted} />
          </Pressable>

          {/* Optional Community / Custom Contact Link */}
          {remoteSettings.contact_custom_url && (
            <Pressable
              onPress={() => void Linking.openURL(remoteSettings.contact_custom_url!)}
              style={[styles.linkRowItem, { borderBottomWidth: 0 }]}
            >
              <LinearGradient
                colors={['#06B6D4', '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linkItemIcon}
              >
                <MaterialCommunityIcons name="earth" size={17} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.linkItemLabel, { color: colors.text, fontSize: 13.5 * scale }]}>
                  {t.contact_dev_menu}
                </Text>
                <Text style={[styles.linkItemSub, { color: colors.muted, fontSize: 11 * scale }]}>
                  {remoteSettings.contact_custom_url}
                </Text>
              </View>
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </Section>

      {/* 9. Footer Credit */}
      <View style={styles.footerWrap}>
        <Text style={[styles.footerText, { color: colors.muted, fontSize: 12 * scale }]}>
          {t.brand_footer.replace('{version}', remoteSettings.latest_version || '1.0.5')}
        </Text>
      </View>
    </>
  );
}
