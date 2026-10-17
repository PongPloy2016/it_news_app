import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BLOGNONE_HOME, FEED_URL } from '../config';
import { submitAppFeedback } from '../services/appSettingsService';
import { getDeviceId } from '../services/deviceIdService';
import { useNews } from '../store/NewsContext';
import { CardLayoutOption, FontSizeOption, LinkOpenMode, ThemeMode } from '../types';
import { analyticsService } from '../services/analyticsService';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    articles,
    bookmarks,
    searchHistory,
    readArticles,
    settings,
    remoteSettings,
    colors,
    scale,
    isDark,
    setThemeMode,
    setFontSize,
    setCardLayout,
    setAiReaderEnabled,
    setLinkOpenMode,
    setDataSaverEnabled,
    clearNewsCache,
    clearBookmarks,
    clearReadArticles,
    clearSearchHistory,
    syncCloudBookmarks,
    isSyncingBookmarks,
    importBookmarksFromDevice,
    isCloudSyncActive,
    setCloudSyncEnabled,
    language,
    resolvedLanguage,
    setLanguage,
    t,
  } = useNews();

  const [deviceId, setDeviceId] = useState<string>('');
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  useEffect(() => {
    void analyticsService.logScreenView(t.settings_title, 'SettingsScreen', {
      page_title: t.settings_title,
    });
  }, [t.settings_title]);

  // Import Device Modal State
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [targetDeviceId, setTargetDeviceId] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Feedback Modal State
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggest_feed' | 'general'>('general');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme Dropdown State
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);

  const toggleThemeDropdown = () => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsThemeDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    void getDeviceId().then(setDeviceId);
  }, []);

  const readCount = Object.keys(readArticles).length;
  const historyCount = searchHistory.length;
  const bookmarkCount = Object.keys(bookmarks).length;
  const cacheCount = articles.length;

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      const result = await syncCloudBookmarks();
      if (result.success) {
        Alert.alert(
          t.alert_sync_success_title,
          t.alert_sync_success_msg.replace('{count}', String(result.count)),
        );
      } else {
        Alert.alert(
          t.alert_sync_fail_title,
          t.alert_sync_fail_msg,
        );
      }
    } catch {
      Alert.alert(t.alert_error, t.alert_sync_fail_msg);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const handleShareDeviceId = async () => {
    if (!deviceId) return;
    try {
      await Share.share({
        title: 'TechThaiNews Device ID',
        message: `TechThaiNews Device ID: ${deviceId}`,
      });
    } catch {
      Alert.alert(t.device_id_label, deviceId);
    }
  };

  const handleImportBookmarks = async () => {
    if (!targetDeviceId.trim()) {
      Alert.alert(t.alert_notice, t.alert_enter_device_id);
      return;
    }
    setIsImporting(true);
    const result = await importBookmarksFromDevice(targetDeviceId.trim());
    setIsImporting(false);
    if (result.success) {
      setIsImportModalVisible(false);
      setTargetDeviceId('');
      Alert.alert(t.import_success_title, t.import_success_msg.replace('{count}', String(result.count)));
    } else {
      Alert.alert(t.alert_error, result.error || t.alert_error);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) {
      Alert.alert(t.alert_notice, t.feedback_alert_empty);
      return;
    }

    setIsSubmitting(true);
    const result = await submitAppFeedback({
      category: feedbackCategory,
      message: feedbackMessage.trim(),
      contact: feedbackContact.trim() || undefined,
      app_version: remoteSettings.latest_version || '1.0.1',
      device_platform: Platform.OS,
    });
    setIsSubmitting(false);

    if (result.success) {
      setIsFeedbackModalVisible(false);
      setFeedbackMessage('');
      setFeedbackContact('');
      Alert.alert(t.feedback_success_title, t.feedback_success_msg);
    } else {
      Alert.alert(t.alert_error, result.error || t.alert_error);
    }
  };

  /* Category Group Divider Header */
  const CategoryGroupHeader = ({
    title,
    color,
  }: {
    title: string;
    color: string;
  }) => (
    <View style={styles.groupHeaderWrap}>
      <View style={[styles.groupHeaderDot, { backgroundColor: color }]} />
      <Text style={[styles.groupHeaderText, { color, fontSize: 11.5 * scale }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.groupHeaderLine, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(0, 0, 0, 0.06)' }]} />
    </View>
  );

  /* Grouped iOS/Material style Section container with vibrant LinearGradient icon */
  const Section = ({
    icon,
    gradientColors,
    title,
    subtitle,
    children,
  }: {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    gradientColors: [string, string];
    title: string;
    subtitle?: string;
    children: React.ReactNode;
  }) => (
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
          <Text style={[styles.sectionTitleText, { color: colors.text, fontSize: 15 * scale }]}>{title}</Text>
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

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: 150 + insets.bottom }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. App Identity Header Banner (Clean, Lightweight & Vibrant with Official Logo) */}
      <View
        style={[
          styles.brandBanner,
          {
            backgroundColor: isDark ? '#141722' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View
          style={[
            styles.brandLogoWrap,
            {
              backgroundColor: isDark ? '#1E2333' : '#F1F5F9',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          <Image
            source={require('../../assets/icon.png')}
            style={styles.brandLogoImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.brandTextCol}>
          <View style={styles.brandTopRow}>
            <Text style={[styles.brandTitle, { color: colors.text, fontSize: 17.5 * scale }]}>
              TechThaiNews
            </Text>
            <View
              style={[
                styles.brandVersionPill,
                {
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#BFDBFE',
                },
              ]}
            >
              <View style={styles.brandLiveDot} />
              <Text style={[styles.brandVersionText, { color: colors.primary, fontSize: 11 * scale }]}>
                v{remoteSettings.latest_version || '1.0.1'}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={2}
            style={[styles.brandTagline, { color: colors.muted, fontSize: 11.5 * scale }]}
          >
            {t.brand_tagline}
          </Text>
        </View>
      </View>

      {/* 2. Global Announcement Banner (if active from Supabase) */}
      {remoteSettings.announcement_active && remoteSettings.announcement_message && (
        <View
          style={[
            styles.announcementCard,
            {
              backgroundColor: isDark ? '#1A233A' : '#EFF6FF',
              borderColor: isDark ? '#2563EB' : '#93C5FD',
            },
          ]}
        >
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.announcementIconWrap}
          >
            <MaterialCommunityIcons name="bullhorn-outline" size={17} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={[styles.announcementTitle, { color: isDark ? '#93C5FD' : '#1D4ED8', fontSize: 13.5 * scale }]}>
              {t.announcement_title}
            </Text>
            <Text style={[styles.announcementDesc, { color: isDark ? '#E2E8F0' : '#1E3A8A', fontSize: 12.5 * scale }]}>
              {remoteSettings.announcement_message}
            </Text>
          </View>
        </View>
      )}

      {/* ================= GROUP 1: DISPLAY & LANGUAGE ================= */}
      <CategoryGroupHeader
        title={t.group_display_lang}
        color="#3B82F6"
      />

      {/* Section 1: ภาษาของแอป (Language Selector) */}
      <Section
        icon="translate"
        gradientColors={['#06B6D4', '#0284C7']}
        title={t.section_language}
        subtitle={t.section_language_sub}
      >
        <View style={[styles.segmentedTrack, { backgroundColor: colors.surfaceVariant }]}>
          {(
            [
              ['th', '🇹🇭 ' + t.lang_th],
              ['en', '🇺🇸 ' + t.lang_en],
              ['system', '📱 ' + t.lang_system],
            ] as const
          ).map(([langKey, langLabel]) => {
            const isSelected = language === langKey;
            return (
              <Pressable
                key={langKey}
                onPress={() => setLanguage(langKey)}
                style={[
                  styles.segmentedTab,
                  isSelected && [
                    styles.segmentedTabActive,
                    {
                      backgroundColor: isDark ? '#22283A' : '#FFFFFF',
                      shadowColor: '#000000',
                      borderColor: isDark ? '#374151' : '#E2E8F0',
                    },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.segmentedText,
                    {
                      color: isSelected ? colors.primary : colors.muted,
                      fontWeight: isSelected ? '800' : '500',
                      fontSize: 13 * scale,
                    },
                  ]}
                >
                  {langLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {language === 'system' && (
          <View
            style={[
              styles.languageIndicatorRow,
              {
                backgroundColor: isDark ? '#101E30' : '#F0F7FF',
                borderColor: isDark ? '#1E3D60' : '#BAE0FD',
              },
            ]}
          >
            <MaterialCommunityIcons name="cellphone-check" size={15} color="#0284C7" />
            <Text style={[styles.languageIndicatorText, { color: isDark ? '#93C5FD' : '#0369A1', fontSize: 11.5 * scale }]}>
              {resolvedLanguage === 'th' ? `🇹🇭 ${t.lang_system_hint_th}` : `🇺🇸 ${t.lang_system_hint_en}`}
            </Text>
          </View>
        )}
      </Section>

      {/* Section 2: รูปแบบการแสดงผลข่าว (Visual Card Layout Selectors) */}
      <Section
        icon="view-dashboard-outline"
        gradientColors={['#3B82F6', '#1D4ED8']}
        title={t.section_card_layout}
        subtitle={t.section_card_layout_sub}
      >
        <View style={styles.layoutCardsRow}>
          {(
            [
              ['compact', t.layout_compact, t.layout_compact_desc],
              ['magazine', t.layout_magazine, t.layout_magazine_desc],
              ['grid', t.layout_grid, t.layout_grid_desc],
            ] as const
          ).map(([layoutKey, layoutTitle, layoutDesc]) => {
            const isSelected = settings.cardLayout === layoutKey;
            return (
              <Pressable
                key={layoutKey}
                onPress={() => setCardLayout(layoutKey)}
                style={[
                  styles.layoutCardItem,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? '#172238'
                        : '#EFF6FF'
                      : isDark
                      ? '#181C28'
                      : '#F8FAFC',
                    borderColor: isSelected ? colors.primary : isDark ? 'rgba(255,255,255,0.06)' : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                {/* Visual Wireframe Schematic */}
                <View
                  style={[
                    styles.schematicBox,
                    { backgroundColor: isDark ? '#11141E' : '#EDF2F7' },
                  ]}
                >
                  {layoutKey === 'compact' && (
                    <View style={styles.schematicCompactWrap}>
                      <View style={{ flex: 1, gap: 3 }}>
                        <View
                          style={[
                            styles.schematicLine,
                            { width: '85%', backgroundColor: isSelected ? colors.primary : colors.muted },
                          ]}
                        />
                        <View
                          style={[
                            styles.schematicLine,
                            { width: '60%', backgroundColor: isDark ? '#374151' : '#94A3B8' },
                          ]}
                        />
                      </View>
                      <View
                        style={[
                          styles.schematicCompactThumb,
                          { backgroundColor: isSelected ? colors.primary : isDark ? '#4B5563' : '#CBD5E1' },
                        ]}
                      />
                    </View>
                  )}

                  {layoutKey === 'magazine' && (
                    <View style={styles.schematicMagWrap}>
                      <View
                        style={[
                          styles.schematicMagHero,
                          { backgroundColor: isSelected ? colors.primary : isDark ? '#4B5563' : '#CBD5E1' },
                        ]}
                      />
                      <View
                        style={[
                          styles.schematicLine,
                          { width: '80%', marginTop: 3, backgroundColor: isDark ? '#374151' : '#94A3B8' },
                        ]}
                      />
                    </View>
                  )}

                  {layoutKey === 'grid' && (
                    <View style={styles.schematicGridWrap}>
                      <View style={styles.schematicGridCol}>
                        <View
                          style={[
                            styles.schematicGridThumb,
                            { backgroundColor: isSelected ? colors.primary : isDark ? '#4B5563' : '#CBD5E1' },
                          ]}
                        />
                        <View
                          style={[
                            styles.schematicLine,
                            { width: '80%', marginTop: 2, backgroundColor: isDark ? '#374151' : '#94A3B8' },
                          ]}
                        />
                      </View>
                      <View style={styles.schematicGridCol}>
                        <View
                          style={[
                            styles.schematicGridThumb,
                            { backgroundColor: isSelected ? colors.primary : isDark ? '#4B5563' : '#CBD5E1' },
                          ]}
                        />
                        <View
                          style={[
                            styles.schematicLine,
                            { width: '80%', marginTop: 2, backgroundColor: isDark ? '#374151' : '#94A3B8' },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>

                {/* Title & Check Badge */}
                <View style={styles.layoutCardLabelWrap}>
                  <Text
                    style={[
                      styles.layoutCardTitle,
                      {
                        color: isSelected ? colors.primary : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                        fontSize: 13 * scale,
                      },
                    ]}
                  >
                    {layoutTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.layoutCardDesc,
                      { color: colors.muted, fontSize: 10 * scale },
                    ]}
                  >
                    {layoutDesc}
                  </Text>
                </View>

                {isSelected && (
                  <View style={[styles.layoutCheckBadge, { backgroundColor: colors.primary }]}>
                    <MaterialCommunityIcons name="check" size={11} color={colors.onPrimary} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Section 3: ธีม (Modern Dropdown Picker) */}
      <Section
        icon="palette-outline"
        gradientColors={['#8B5CF6', '#7C3AED']}
        title={t.section_theme}
        subtitle={t.section_theme_sub}
      >
        {(() => {
          const themeOptions = [
            {
              key: 'system' as const,
              title: t.theme_system,
              desc: t.theme_system_desc,
              icon: 'theme-light-dark' as const,
              accent: '#3B82F6',
              bgPreview: isDark ? '#11141E' : '#EDF2F7',
            },
            {
              key: 'light' as const,
              title: t.theme_light,
              desc: t.theme_light_desc,
              icon: 'white-balance-sunny' as const,
              accent: '#1565C0',
              bgPreview: '#FFFFFF',
            },
            {
              key: 'dark' as const,
              title: t.theme_dark,
              desc: t.theme_dark_desc,
              icon: 'weather-night' as const,
              accent: '#8DB9FF',
              bgPreview: '#111318',
            },
            {
              key: 'midnight' as const,
              title: t.theme_midnight,
              desc: t.theme_midnight_desc,
              icon: 'moon-waning-crescent' as const,
              accent: '#38BDF8',
              bgPreview: '#000000',
            },
            {
              key: 'sepia' as const,
              title: t.theme_sepia,
              desc: t.theme_sepia_desc,
              icon: 'book-open-page-variant-outline' as const,
              accent: '#B45309',
              bgPreview: '#FAF4E8',
            },
            {
              key: 'tech' as const,
              title: t.theme_tech,
              desc: t.theme_tech_desc,
              icon: 'laptop' as const,
              accent: '#06B6D4',
              bgPreview: '#070D19',
            },
          ];

          const activeThemeOption =
            themeOptions.find((opt) => opt.key === settings.themeMode) || themeOptions[0];

          return (
            <View style={styles.themeDropdownContainer}>
              {/* Dropdown Trigger Header */}
              <Pressable
                onPress={toggleThemeDropdown}
                accessibilityRole="button"
                accessibilityLabel={`${t.section_theme}: ${activeThemeOption.title}`}
                style={({ pressed }) => [
                  styles.themeDropdownTrigger,
                  {
                    backgroundColor: isDark ? '#181C28' : '#F8FAFC',
                    borderColor: isThemeDropdownOpen
                      ? colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {/* Left: Active theme icon & text */}
                <View style={styles.themeDropdownLeft}>
                  <View
                    style={[
                      styles.themeDropdownIconBadge,
                      { backgroundColor: `${activeThemeOption.accent}1F` },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={activeThemeOption.icon}
                      size={20}
                      color={activeThemeOption.accent}
                    />
                  </View>
                  <View style={styles.themeDropdownTextWrap}>
                    <Text
                      style={[
                        styles.themeDropdownTitle,
                        { color: colors.text, fontSize: 14 * scale },
                      ]}
                    >
                      {activeThemeOption.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.themeDropdownDesc,
                        { color: colors.muted, fontSize: 11 * scale },
                      ]}
                    >
                      {activeThemeOption.desc}
                    </Text>
                  </View>
                </View>

                {/* Right: Color swatch & Chevron */}
                <View style={styles.themeDropdownRight}>
                  <View
                    style={[
                      styles.themeSwatchPreview,
                      {
                        backgroundColor: activeThemeOption.bgPreview,
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.themeSwatchDot,
                        { backgroundColor: activeThemeOption.accent },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.themeDropdownChevronWrap,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)' },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isThemeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={colors.text}
                    />
                  </View>
                </View>
              </Pressable>

              {/* Dropdown Options List */}
              {isThemeDropdownOpen && (
                <View
                  style={[
                    styles.themeDropdownMenu,
                    {
                      backgroundColor: isDark ? '#171B26' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
                    },
                  ]}
                >
                  {themeOptions.map((themeItem, index) => {
                    const isSelected = settings.themeMode === themeItem.key;
                    const isLast = index === themeOptions.length - 1;

                    return (
                      <Pressable
                        key={themeItem.key}
                        onPress={() => {
                          setThemeMode(themeItem.key);
                          if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
                            UIManager.setLayoutAnimationEnabledExperimental(true);
                          }
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setIsThemeDropdownOpen(false);
                        }}
                        style={({ pressed }) => [
                          styles.themeDropdownItem,
                          isSelected && {
                            backgroundColor: isDark ? '#1E2638' : '#EFF6FF',
                          },
                          !isLast && [
                            styles.themeDropdownItemBorder,
                            {
                              borderBottomColor: isDark
                                ? 'rgba(255, 255, 255, 0.05)'
                                : 'rgba(0, 0, 0, 0.05)',
                            },
                          ],
                          { opacity: pressed ? 0.75 : 1 },
                        ]}
                      >
                        {/* Theme Option Icon */}
                        <View
                          style={[
                            styles.themeOptionIconBadge,
                            {
                              backgroundColor: `${themeItem.accent}1F`,
                              borderColor: isSelected ? themeItem.accent : 'transparent',
                              borderWidth: isSelected ? 1 : 0,
                            },
                          ]}
                        >
                          <MaterialCommunityIcons
                            name={themeItem.icon}
                            size={18}
                            color={themeItem.accent}
                          />
                        </View>

                        {/* Option Text */}
                        <View style={styles.themeOptionTextWrap}>
                          <Text
                            style={[
                              styles.themeOptionTitle,
                              {
                                color: isSelected ? colors.primary : colors.text,
                                fontWeight: isSelected ? '700' : '500',
                                fontSize: 13.5 * scale,
                              },
                            ]}
                          >
                            {themeItem.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.themeOptionDesc,
                              { color: colors.muted, fontSize: 10.5 * scale },
                            ]}
                          >
                            {themeItem.desc}
                          </Text>
                        </View>

                        {/* Right side: Palette swatch + Checkmark */}
                        <View style={styles.themeOptionRight}>
                          <View
                            style={[
                              styles.themeOptionSwatch,
                              {
                                backgroundColor: themeItem.bgPreview,
                                borderColor: isDark
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'rgba(0, 0, 0, 0.1)',
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.themeOptionSwatchDot,
                                { backgroundColor: themeItem.accent },
                              ]}
                            />
                          </View>

                          <View style={styles.themeOptionCheckPlaceholder}>
                            {isSelected && (
                              <View
                                style={[
                                  styles.themeOptionCheckBadge,
                                  { backgroundColor: colors.primary },
                                ]}
                              >
                                <MaterialCommunityIcons
                                  name="check"
                                  size={12}
                                  color={colors.onPrimary}
                                />
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()}
      </Section>

      {/* Section 4: ขนาดตัวอักษร + Live Preview Card */}
      <Section
        icon="format-size"
        gradientColors={['#F59E0B', '#D97706']}
        title={t.section_font_size}
        subtitle={t.section_font_size_sub}
      >
        {/* Segmented Font Size Selector */}
        <View style={[styles.segmentedTrack, { backgroundColor: colors.surfaceVariant }]}>
          {(
            [
              { key: 'small' as const, label: t.font_small, sampleSize: 13 },
              { key: 'medium' as const, label: t.font_medium, sampleSize: 15 },
              { key: 'large' as const, label: t.font_large, sampleSize: 17 },
            ] as const
          ).map((item) => {
            const isSelected = settings.fontSize === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFontSize(item.key)}
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
                <Text
                  style={{
                    fontSize: item.sampleSize,
                    fontWeight: isSelected ? '800' : '600',
                    color: isSelected ? '#F59E0B' : colors.muted,
                  }}
                >
                  A
                </Text>
                <Text
                  style={[
                    styles.segmentedText,
                    {
                      color: isSelected ? colors.text : colors.muted,
                      fontWeight: isSelected ? '700' : '500',
                      fontSize: 13 * scale,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Live Preview Card */}
        <View
          style={[
            styles.livePreviewCard,
            {
              backgroundColor: isDark ? '#181C28' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border,
              borderLeftColor: '#F59E0B',
              borderLeftWidth: 3.5,
            },
          ]}
        >
          <View style={styles.livePreviewTopRow}>
            <View style={[styles.livePreviewTag, { backgroundColor: isDark ? '#2C2216' : '#FEF3C7' }]}>
              <MaterialCommunityIcons name="eye-outline" size={12} color="#D97706" />
              <Text style={[styles.livePreviewTagText, { color: '#D97706', fontSize: 11 * scale }]}>
                {t.preview_tag}
              </Text>
            </View>
            <Text style={[styles.liveScaleBadge, { color: colors.muted, fontSize: 11 * scale }]}>
              {Math.round(scale * 100)}% {t.preview_standard}
            </Text>
          </View>

          <Text
            numberOfLines={2}
            style={[styles.liveHeadline, { color: colors.text, fontSize: 15 * scale }]}
          >
            {t.preview_headline}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.liveDesc, { color: colors.muted, fontSize: 12.5 * scale }]}
          >
            {t.preview_desc}
          </Text>
          <View style={styles.liveMetaRow}>
            <View style={[styles.liveDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.liveMetaText, { color: colors.muted, fontSize: 11 * scale }]}>
              {t.preview_meta}
            </Text>
          </View>
        </View>
      </Section>

      {/* ================= GROUP 2: READING & PERFORMANCE ================= */}
      <CategoryGroupHeader
        title={t.group_reading}
        color="#10B981"
      />

      {/* Section 5: การอ่านและการเปิดลิงก์ (Reading & Links) */}
      <Section
        icon="book-open-outline"
        gradientColors={['#10B981', '#059669']}
        title={t.section_reading}
        subtitle={t.section_reading_sub}
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

      {/* ================= GROUP 3: CLOUD & STORAGE ================= */}
      <CategoryGroupHeader
        title={t.group_sync_storage}
        color="#0284C7"
      />

      {/* Section 6: Supabase Cloud Sync (Controlled by remoteSettings.cloud_sync_enabled) */}
      {remoteSettings.cloud_sync_enabled !== false && (
        <Section
          icon="cloud-sync-outline"
          gradientColors={['#0284C7', '#1D4ED8']}
          title={t.section_cloud}
          subtitle={t.section_cloud_sub}
        >
          {/* Cloud Sync Toggle Row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 10,
            }}
          >
            <View style={{ flex: 1, marginRight: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <LinearGradient
                colors={['#0284C7', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.rowItemIconBadge}
              >
                <MaterialCommunityIcons name="cloud-sync-outline" size={16} color="#FFFFFF" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: 13.5 * scale }}>
                  {t.cloud_enable_title}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 11.5 * scale, marginTop: 2 }}>
                  {isCloudSyncActive ? t.cloud_active_desc : t.cloud_disabled_desc}
                </Text>
              </View>
            </View>
            <Switch
              value={isCloudSyncActive}
              onValueChange={setCloudSyncEnabled}
              trackColor={{ false: colors.border, true: '#0284C7' }}
              thumbColor={isCloudSyncActive ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {/* Cloud Status Row */}
          <View style={styles.cloudStatusRow}>
            <View style={styles.cloudPulseWrap}>
              <View style={styles.cloudDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cloudStatusTitle, { color: colors.text, fontSize: 13 * scale }]}>
                {t.cloud_connected}
              </Text>
              <Text style={[styles.cloudStatusSub, { color: colors.muted, fontSize: 11 * scale }]}>
                {t.cloud_secure_sub}
              </Text>
            </View>
          </View>

          {/* Device ID Chip & Share Action */}
          <View
            style={[
              styles.deviceIdBar,
              { backgroundColor: isDark ? '#181C28' : '#F1F5F9', borderColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border },
            ]}
          >
            <MaterialCommunityIcons name="identifier" size={17} color="#0284C7" />
            <View style={{ flex: 1, marginHorizontal: 8 }}>
              <Text style={[styles.deviceIdLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>
                {t.device_id_label}
              </Text>
              <Text
                selectable
                numberOfLines={1}
                ellipsizeMode="middle"
                style={[styles.deviceIdValue, { color: colors.text, fontSize: 12 * scale }]}
              >
                {deviceId || t.checking}
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => void handleShareDeviceId()}
              style={[styles.sharePillBtn, { backgroundColor: isDark ? '#22283A' : '#FFFFFF' }]}
              accessibilityLabel="Share Device ID"
            >
              <MaterialCommunityIcons name="share-variant-outline" size={14} color="#0284C7" />
              <Text style={[styles.sharePillText, { color: '#0284C7', fontSize: 11 * scale }]}>{t.share}</Text>
            </Pressable>
          </View>

          {/* Action Buttons Row: Sync & Connect Another Device */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <Pressable
              disabled={isManualSyncing || isSyncingBookmarks}
              onPress={() => void handleManualSync()}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#0284C7', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.cloudSyncActionBtn,
                  (isManualSyncing || isSyncingBookmarks) && { opacity: 0.7 },
                ]}
              >
                {isManualSyncing || isSyncingBookmarks ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="cloud-sync-outline" size={17} color="#FFFFFF" />
                    <Text style={[styles.cloudSyncActionBtnText, { color: '#FFFFFF', fontSize: 13 * scale }]}>
                      {`${t.sync_cloud} (${bookmarkCount})`}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => setIsImportModalVisible(true)}
              style={[
                styles.cloudSyncActionBtn,
                {
                  backgroundColor: isDark ? '#181C28' : '#F1F5F9',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : colors.border,
                  paddingHorizontal: 12,
                },
              ]}
              accessibilityLabel="Connect other device"
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={17} color="#0284C7" />
              <Text style={[styles.cloudSyncActionBtnText, { color: colors.text, fontSize: 13 * scale }]}>
                {t.connect_other_device}
              </Text>
            </Pressable>
          </View>
        </Section>
      )}

      {/* Section 7: พื้นที่จัดเก็บและประวัติ (Storage & Data Management) */}
      <Section
        icon="database-outline"
        gradientColors={['#EC4899', '#BE185D']}
        title={t.section_storage}
        subtitle={t.section_storage_sub}
      >
        {/* Metric Overview Badges with Vibrant Circular Icons */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              style={styles.metricIconCircle}
            >
              <MaterialCommunityIcons name="eye-check-outline" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
              {readCount}
            </Text>
            <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_read}</Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.metricIconCircle}
            >
              <MaterialCommunityIcons name="history" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
              {historyCount}
            </Text>
            <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_search}</Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.metricIconCircle}
            >
              <MaterialCommunityIcons name="folder-text-outline" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
              {cacheCount}
            </Text>
            <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_cache}</Text>
          </View>

          <View style={[styles.metricChip, { backgroundColor: isDark ? '#181C28' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
            <LinearGradient
              colors={['#EC4899', '#BE185D']}
              style={styles.metricIconCircle}
            >
              <MaterialCommunityIcons name="bookmark-outline" size={14} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.metricChipValue, { color: colors.text, fontSize: 14 * scale }]}>
              {bookmarkCount}
            </Text>
            <Text style={[styles.metricChipLabel, { color: colors.muted, fontSize: 10.5 * scale }]}>{t.metric_bookmarks}</Text>
          </View>
        </View>

        {/* Clean Storage Action Rows */}
        <View style={styles.storageActionsList}>
          {/* Row 1: Clear Read History */}
          <View style={[styles.storageRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.storageItemTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.storage_read_title}
              </Text>
              <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {readCount > 0 ? t.storage_read_has.replace('{count}', String(readCount)) : t.storage_read_empty}
              </Text>
            </View>
            <Pressable
              disabled={readCount === 0}
              onPress={() => {
                Alert.alert(
                  t.storage_read_title,
                  t.alert_confirm_reset_read.replace('{count}', String(readCount)),
                  [
                    { text: t.btn_cancel, style: 'cancel' },
                    {
                      text: t.btn_reset,
                      style: 'destructive',
                      onPress: () => {
                        void clearReadArticles();
                        Alert.alert(t.alert_success, t.alert_reset_read_success);
                      },
                    },
                  ],
                );
              }}
              style={[
                styles.tablePillBtn,
                { backgroundColor: isDark ? '#1E2B40' : '#EFF6FF' },
                readCount === 0 && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.tablePillBtnText, { color: '#3B82F6', fontSize: 12 * scale }]}>
                {t.btn_reset}
              </Text>
            </Pressable>
          </View>

          {/* Row 2: Clear Search History */}
          <View style={[styles.storageRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.storageItemTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.storage_search_title}
              </Text>
              <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {historyCount > 0 ? t.storage_search_has.replace('{count}', String(historyCount)) : t.storage_search_empty}
              </Text>
            </View>
            <Pressable
              disabled={historyCount === 0}
              onPress={() => {
                Alert.alert(
                  t.storage_search_title,
                  t.alert_confirm_clear_search.replace('{count}', String(historyCount)),
                  [
                    { text: t.btn_cancel, style: 'cancel' },
                    {
                      text: t.btn_clear,
                      style: 'destructive',
                      onPress: () => {
                        clearSearchHistory();
                        Alert.alert(t.alert_success, t.alert_clear_search_success);
                      },
                    },
                  ],
                );
              }}
              style={[
                styles.tablePillBtn,
                { backgroundColor: isDark ? '#281E3B' : '#F5F3FF' },
                historyCount === 0 && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.tablePillBtnText, { color: '#8B5CF6', fontSize: 12 * scale }]}>
                {t.btn_clear}
              </Text>
            </Pressable>
          </View>

          {/* Row 3: Clear Cached Articles */}
          <View style={[styles.storageRowItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.storageItemTitle, { color: colors.text, fontSize: 13.5 * scale }]}>
                {t.storage_cache_title}
              </Text>
              <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {cacheCount > 0 ? t.storage_cache_has.replace('{count}', String(cacheCount)) : t.storage_cache_empty}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                void clearNewsCache();
                Alert.alert(t.alert_success, t.alert_clear_cache_success);
              }}
              style={[styles.tablePillBtn, { backgroundColor: isDark ? '#2E2214' : '#FFFBEB' }]}
            >
              <Text style={[styles.tablePillBtnText, { color: '#F59E0B', fontSize: 12 * scale }]}>
                {t.btn_clear_cache}
              </Text>
            </Pressable>
          </View>

          {/* Row 4: Clear Bookmarks (Destructive) */}
          <View style={[styles.storageRowItem, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.storageItemTitle, { color: colors.error, fontSize: 13.5 * scale }]}>
                {t.storage_bookmarks_title}
              </Text>
              <Text style={[styles.storageItemSub, { color: colors.muted, fontSize: 11.5 * scale }]}>
                {bookmarkCount > 0
                  ? remoteSettings.cloud_sync_enabled !== false
                    ? t.storage_bookmarks_cloud_sub.replace('{count}', String(bookmarkCount))
                    : t.storage_bookmarks_local_sub.replace('{count}', String(bookmarkCount))
                  : t.storage_bookmarks_empty}
              </Text>
            </View>
            <Pressable
              disabled={bookmarkCount === 0}
              onPress={() => {
                const message =
                  remoteSettings.cloud_sync_enabled !== false
                    ? t.alert_confirm_delete_bookmarks.replace('{count}', String(bookmarkCount))
                    : t.alert_confirm_delete_bookmarks_local.replace('{count}', String(bookmarkCount));
                Alert.alert(
                  t.storage_bookmarks_title,
                  message,
                  [
                    { text: t.btn_cancel, style: 'cancel' },
                    { text: t.btn_delete_all, style: 'destructive', onPress: clearBookmarks },
                  ],
                );
              }}
              style={[
                styles.tablePillBtnDestructive,
                { backgroundColor: isDark ? '#3E1418' : '#FEE2E2', borderColor: colors.error },
                bookmarkCount === 0 && { opacity: 0.4 },
              ]}
            >
              <Text style={[styles.tablePillBtnDestructiveText, { color: colors.error, fontSize: 12 * scale }]}>
                {t.btn_delete_all}
              </Text>
            </Pressable>
          </View>
        </View>
      </Section>

      {/* ================= GROUP 4: SUPPORT & ABOUT ================= */}
      <CategoryGroupHeader
        title={t.group_support_about}
        color="#6366F1"
      />

      {/* Section 8: ช่วยเหลือและข้อกำหนด (Support & Legal) */}
      <Section
        icon="shield-check-outline"
        gradientColors={['#6366F1', '#4F46E5']}
        title={t.section_support}
        subtitle={t.section_support_sub}
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
          {t.brand_footer.replace('{version}', remoteSettings.latest_version || '1.0.1')}
        </Text>
      </View>


      {/* Feedback Modal */}
      <Modal
        visible={isFeedbackModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFeedbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t.feedback_modal_title}</Text>
              <Pressable hitSlop={8} onPress={() => setIsFeedbackModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            {/* Category selection chips */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.feedback_modal_sub}</Text>
            <View style={styles.categoryRow}>
              {(
                [
                  ['general', t.feedback_cat_general],
                  ['bug', t.feedback_cat_bug],
                  ['suggest_feed', t.feedback_cat_suggest],
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
            <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.feedback_placeholder}</Text>
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
              placeholder={t.feedback_placeholder}
              placeholderTextColor={colors.muted}
              value={feedbackMessage}
              onChangeText={setFeedbackMessage}
            />

            {/* Contact input */}
            <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.feedback_contact_label}</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
              placeholder={t.feedback_contact_placeholder}
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
                styles.submitModalBtn,
                { backgroundColor: colors.primary },
                isSubmitting && { opacity: 0.6 },
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.submitModalBtnText, { color: colors.onPrimary }]}>
                  {t.btn_submit}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Import / Connect Other Device Modal */}
      <Modal
        visible={isImportModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsImportModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="cloud-download-outline" size={22} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t.modal_link_title}</Text>
              </View>
              <Pressable hitSlop={8} onPress={() => setIsImportModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={[styles.fieldSubLabel, { color: colors.muted, marginBottom: 12, lineHeight: 18 }]}>
              {t.modal_link_sub}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.muted }]}>{t.modal_link_label}</Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  color: colors.text,
                  borderColor: colors.border,
                  height: 48,
                },
              ]}
              placeholder="e.g. d1e2f3a4-..."
              placeholderTextColor={colors.muted}
              value={targetDeviceId}
              onChangeText={setTargetDeviceId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              disabled={isImporting}
              onPress={() => void handleImportBookmarks()}
              style={[
                styles.submitModalBtn,
                { backgroundColor: colors.primary, marginTop: 12 },
                isImporting && { opacity: 0.6 },
              ]}
            >
              {isImporting ? (
                <ActivityIndicator color={colors.onPrimary} size="small" />
              ) : (
                <Text style={[styles.submitModalBtnText, { color: colors.onPrimary }]}>
                  {t.btn_import}
                </Text>
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

  /* Category Group Headers */
  groupHeaderWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: -2,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  groupHeaderDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  groupHeaderText: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  groupHeaderLine: {
    flex: 1,
    height: 1,
    marginLeft: 6,
    opacity: 0.5,
  },

  /* 1. App Brand Banner */
  brandBanner: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    elevation: 3,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  brandLogoWrap: {
    borderRadius: 16,
    borderWidth: 1,
    elevation: 4,
    height: 56,
    overflow: 'hidden',
    shadowColor: '#00D2FF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: 56,
  },
  brandLogoImage: {
    borderRadius: 15,
    height: '100%',
    width: '100%',
  },
  brandTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  brandTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandVersionPill: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  brandLiveDot: {
    backgroundColor: '#10B981',
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  brandVersionText: {
    fontWeight: '700',
  },
  brandTagline: {
    lineHeight: 16,
    marginTop: 3,
  },

  /* Announcement */
  announcementCard: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 12,
  },
  announcementIconWrap: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  announcementTitle: {
    fontWeight: '700',
    marginBottom: 2,
  },
  announcementDesc: {
    lineHeight: 18,
  },

  /* Grouped Section Styles */
  sectionContainer: {
    borderRadius: 20,
    borderWidth: 1,
    elevation: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  sectionIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sectionTitleText: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubtitleText: {
    marginTop: 2,
  },
  sectionBody: {
    gap: 10,
  },

  /* 3. Layout Cards Row */
  layoutCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  layoutCardItem: {
    alignItems: 'center',
    borderRadius: 14,
    flex: 1,
    padding: 10,
    position: 'relative',
  },
  schematicBox: {
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginBottom: 8,
    overflow: 'hidden',
    padding: 6,
    width: '100%',
  },
  schematicCompactWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  schematicCompactThumb: {
    borderRadius: 4,
    height: 24,
    width: 22,
  },
  schematicMagWrap: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
  },
  schematicMagHero: {
    borderRadius: 3,
    height: 18,
    width: '90%',
  },
  schematicGridWrap: {
    flexDirection: 'row',
    gap: 4,
    height: '100%',
    justifyContent: 'center',
  },
  schematicGridCol: {
    alignItems: 'center',
    flex: 1,
  },
  schematicGridThumb: {
    borderRadius: 3,
    height: 18,
    width: '100%',
  },
  schematicLine: {
    borderRadius: 2,
    height: 4,
  },
  layoutCardLabelWrap: {
    alignItems: 'center',
  },
  layoutCardTitle: {
    textAlign: 'center',
  },
  layoutCardDesc: {
    marginTop: 2,
    textAlign: 'center',
  },
  layoutCheckBadge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 18,
    justifyContent: 'center',
    position: 'absolute',
    right: 6,
    top: 6,
    width: 18,
  },

  /* Modern Theme Dropdown */
  themeDropdownContainer: {
    width: '100%',
  },
  themeDropdownTrigger: {
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  themeDropdownLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  themeDropdownIconBadge: {
    alignItems: 'center',
    borderRadius: 11,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  themeDropdownTextWrap: {
    flex: 1,
    gap: 2,
  },
  themeDropdownTitle: {
    fontWeight: '700',
  },
  themeDropdownDesc: {},
  themeDropdownRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginLeft: 8,
  },
  themeSwatchPreview: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  themeSwatchDot: {
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  themeDropdownChevronWrap: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  themeDropdownMenu: {
    borderRadius: 14,
    borderWidth: 1,
    elevation: 4,
    marginTop: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  themeDropdownItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 12,
  },
  themeDropdownItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  themeOptionIconBadge: {
    alignItems: 'center',
    borderRadius: 9,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  themeOptionTextWrap: {
    flex: 1,
    gap: 2,
  },
  themeOptionTitle: {},
  themeOptionDesc: {},
  themeOptionRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  themeOptionSwatch: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  themeOptionSwatchDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  themeOptionCheckPlaceholder: {
    alignItems: 'center',
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  themeOptionCheckBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },

  /* Segmented Pill Track */
  segmentedTrack: {
    borderRadius: 14,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  segmentedTab: {
    alignItems: 'center',
    borderRadius: 11,
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 9,
  },
  segmentedTabActive: {
    borderWidth: 1,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  },
  segmentedText: {
    textAlign: 'center',
  },
  languageIndicatorRow: {
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  languageIndicatorText: {
    fontWeight: '600',
  },

  /* Live Preview Card */
  livePreviewCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    padding: 14,
  },
  livePreviewTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  livePreviewTag: {
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  livePreviewTagText: {
    fontWeight: '700',
  },
  liveScaleBadge: {
    fontWeight: '500',
  },
  liveHeadline: {
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 4,
  },
  liveDesc: {
    lineHeight: 19,
    marginBottom: 8,
  },
  liveMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  liveDot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  liveMetaText: {
    fontWeight: '500',
  },

  /* Reading settings row */
  fieldSubLabel: {
    fontWeight: '600',
    marginBottom: 2,
  },
  settingRowItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowItemTitle: {
    fontWeight: '700',
  },
  rowItemDesc: {
    lineHeight: 17,
    marginTop: 2,
  },
  rowItemIconBadge: {
    alignItems: 'center',
    borderRadius: 8,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },

  /* Cloud Card Box */
  cloudCardBox: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 14,
  },
  cloudStatusRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  cloudPulseWrap: {
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 10,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  cloudDot: {
    backgroundColor: '#10B981',
    borderRadius: 5,
    height: 10,
    width: 10,
  },
  cloudStatusTitle: {
    fontWeight: '700',
  },
  cloudStatusSub: {
    marginTop: 1,
  },
  deviceIdBar: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deviceIdLabel: {
    fontWeight: '600',
  },
  deviceIdValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '600',
    marginTop: 1,
  },
  sharePillBtn: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sharePillText: {
    fontWeight: '700',
  },
  cloudSyncActionBtn: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  cloudSyncActionBtnText: {
    fontWeight: '700',
  },

  /* Storage & Data Metrics */
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    alignItems: 'center',
    borderRadius: 10,
    flex: 1,
    gap: 2,
    paddingVertical: 8,
  },
  metricIconCircle: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginBottom: 4,
    width: 28,
  },
  metricChipLabel: {
    fontWeight: '600',
  },
  metricChipValue: {
    fontWeight: '800',
  },
  storageActionsList: {
    marginTop: 4,
  },
  storageRowItem: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  storageItemTitle: {
    fontWeight: '700',
  },
  storageItemSub: {
    marginTop: 2,
  },
  tablePillBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tablePillBtnText: {
    fontWeight: '700',
  },
  tablePillBtnDestructive: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tablePillBtnDestructiveText: {
    fontWeight: '700',
  },

  /* Links List */
  linkListWrap: {
    borderRadius: 14,
  },
  linkRowItem: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 11,
  },
  linkItemIcon: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  linkItemLabel: {
    flex: 1,
    fontWeight: '600',
  },
  linkItemSub: {
    marginTop: 2,
  },

  footerWrap: {
    alignItems: 'center',
    marginTop: 10,
    paddingBottom: 20,
  },
  footerText: {
    fontWeight: '500',
  },

  /* Modal */
  modalOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
  modalDragHandle: {
    alignSelf: 'center',
    backgroundColor: '#94A3B8',
    borderRadius: 3,
    height: 4,
    marginBottom: 14,
    opacity: 0.5,
    width: 40,
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
  submitModalBtn: {
    alignItems: 'center',
    borderRadius: 12,
    marginTop: 18,
    padding: 13,
  },
  submitModalBtnText: {
    fontWeight: '800',
  },
});
