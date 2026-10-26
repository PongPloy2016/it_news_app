import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { styles } from '../styles';
import { SettingsViewModel } from '../types';
import { CategoryGroupHeader } from './CategoryGroupHeader';
import { Section } from './Section';

interface ReadingSectionProps {
  vm: SettingsViewModel;
}

export function ReadingSection({ vm }: ReadingSectionProps) {
  const {
    colors,
    scale,
    isDark,
    settings,
    remoteSettings,
    setLinkOpenMode,
    setDataSaverEnabled,
    setAiReaderEnabled,
    t,
  } = vm;

  return (
    <>
      {/* Category Group Header */}
      <CategoryGroupHeader
        title={t.group_reading}
        color="#10B981"
        scale={scale}
        isDark={isDark}
      />

      {/* Section 5: การอ่านและการเปิดลิงก์ (Reading & Links) */}
      <Section
        icon="book-open-outline"
        gradientColors={['#10B981', '#059669']}
        title={t.section_reading}
        subtitle={t.section_reading_sub}
        isDark={isDark}
        colors={colors}
        scale={scale}
      >
        <Text style={[styles.fieldSubLabel, { color: colors.muted, fontSize: 12 * scale }]}>
          {t.link_channel_label}
        </Text>
        <View style={[styles.segmentedTrack, { backgroundColor: colors.surfaceVariant, marginBottom: 12 }]}>
          {(
            [
              ['in_app', t.link_in_app, 'dock-window', '#10B981'],
              ['external', t.link_external, 'open-in-new', '#0284C7'],
            ] as const
          ).map(([linkKey, linkLabel, linkIcon, linkColor]) => {
            const isSelected = (settings.linkOpenMode ?? 'in_app') === linkKey;
            return (
              <Pressable
                key={linkKey}
                onPress={() => setLinkOpenMode(linkKey)}
                style={[
                  styles.segmentedTab,
                  isSelected && [
                    styles.segmentedTabActive,
                    {
                      backgroundColor: isDark ? '#22283A' : '#FFFFFF',
                      borderColor: isDark ? '#374151' : '#E2E8F0',
                    },
                  ],
                ]}
              >
                <MaterialCommunityIcons
                  name={linkIcon}
                  size={16}
                  color={isSelected ? linkColor : colors.muted}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.segmentedText,
                    {
                      color: isSelected ? colors.text : colors.muted,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 12.5 * scale,
                    },
                  ]}
                >
                  {linkLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Data Saver Mode Toggle Row */}
        <View style={[styles.settingRowItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
          <View style={{ flex: 1, marginRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rowItemIconBadge}
            >
              <MaterialCommunityIcons name="signal" size={15} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowItemTitle, { color: colors.text, fontSize: 14 * scale }]}>
                {t.data_saver_title}
              </Text>
              <Text style={[styles.rowItemDesc, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {t.data_saver_desc}
              </Text>
            </View>
          </View>
          <Switch
            value={Boolean(settings.dataSaverEnabled)}
            onValueChange={setDataSaverEnabled}
            trackColor={{ false: colors.border, true: '#10B981' }}
            thumbColor={settings.dataSaverEnabled ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        {/* AI Reader Feature Toggle (Controlled remotely from Supabase) */}
        {remoteSettings.is_ai_enabled && (
          <View style={[styles.settingRowItem, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
            <View style={{ flex: 1, marginRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowItemIconBadge}
              >
                <MaterialCommunityIcons name="creation" size={15} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowItemTitle, { color: colors.text, fontSize: 14 * scale }]}>
                  {t.ai_reader_title}
                </Text>
                <Text style={[styles.rowItemDesc, { color: colors.muted, fontSize: 11.5 * scale }]}>
                  {t.ai_reader_desc}
                </Text>
              </View>
            </View>
            <Switch
              value={settings.aiReaderEnabled}
              onValueChange={setAiReaderEnabled}
              trackColor={{ false: colors.border, true: '#8B5CF6' }}
              thumbColor={settings.aiReaderEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>
        )}
      </Section>
    </>
  );
}
