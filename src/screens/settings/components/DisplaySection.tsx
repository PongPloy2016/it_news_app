import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { styles } from '../styles';
import { SettingsViewModel, ThemeOption } from '../types';
import { CategoryGroupHeader } from './CategoryGroupHeader';
import { Section } from './Section';

interface DisplaySectionProps {
  vm: SettingsViewModel;
}

export function DisplaySection({ vm }: DisplaySectionProps) {
  const {
    colors,
    scale,
    isDark,
    language,
    resolvedLanguage,
    setLanguage,
    settings,
    setCardLayout,
    setThemeMode,
    setFontSize,
    isThemeDropdownOpen,
    toggleThemeDropdown,
    closeThemeDropdown,
    t,
  } = vm;

  const themeOptions: ThemeOption[] = [
    { key: 'system', title: t.theme_system, accent: '#3B82F6' },
    { key: 'light', title: t.theme_light, accent: '#1565C0' },
    { key: 'dark', title: t.theme_dark, accent: '#8DB9FF' },
    { key: 'midnight', title: t.theme_midnight, accent: '#38BDF8' },
    { key: 'sepia', title: t.theme_sepia, accent: '#B45309' },
    { key: 'tech', title: t.theme_tech, accent: '#06B6D4' },
    { key: 'forest', title: t.theme_forest, accent: '#10B981' },
    { key: 'purple', title: t.theme_purple, accent: '#A855F7' },
    { key: 'sunset', title: t.theme_sunset, accent: '#F43F5E' },
  ];

  const activeThemeOption =
    themeOptions.find((opt) => opt.key === settings.themeMode) || themeOptions[0];

  return (
    <>
      {/* Category Group Header */}
      <CategoryGroupHeader
        title={t.group_display_lang}
        color="#3B82F6"
        scale={scale}
        isDark={isDark}
      />

      {/* Section 1: ภาษาของแอป (Language Selector) */}
      <Section
        icon="translate"
        gradientColors={['#06B6D4', '#0284C7']}
        title={t.section_language}
        subtitle={t.section_language_sub}
        isDark={isDark}
        colors={colors}
        scale={scale}
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
        isDark={isDark}
        colors={colors}
        scale={scale}
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

      {/* Section 3: ธีม (Clean Human-Designed Dropdown) */}
      <Section
        icon="palette-outline"
        gradientColors={['#8B5CF6', '#7C3AED']}
        title={t.section_theme}
        subtitle={t.section_theme_sub}
        isDark={isDark}
        colors={colors}
        scale={scale}
      >
        <View style={styles.themeDropdownContainer}>
          {/* Dropdown Trigger Header */}
          <Pressable
            onPress={toggleThemeDropdown}
            accessibilityRole="button"
            accessibilityLabel={`${t.section_theme}: ${activeThemeOption.title}`}
            style={({ pressed }) => [
              styles.themeDropdownTrigger,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8FAFC',
                borderColor: isThemeDropdownOpen
                  ? colors.primary
                  : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}
          >
            <View style={styles.themeDropdownLeft}>
              <View
                style={[
                  styles.themeColorDot,
                  {
                    backgroundColor: activeThemeOption.accent,
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.12)',
                  },
                ]}
              >
                {activeThemeOption.key === 'system' && (
                  <MaterialCommunityIcons name="theme-light-dark" size={12} color="#FFFFFF" />
                )}
              </View>
              <Text
                style={[
                  styles.themeDropdownTitle,
                  { color: colors.text, fontSize: 14.5 * scale },
                ]}
              >
                {activeThemeOption.title}
              </Text>
            </View>

            <MaterialCommunityIcons
              name={isThemeDropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.muted}
            />
          </Pressable>

          {/* Dropdown Options List */}
          {isThemeDropdownOpen && (
            <View
              style={[
                styles.themeDropdownMenu,
                {
                  backgroundColor: isDark ? '#181C26' : '#FFFFFF',
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
                      closeThemeDropdown();
                    }}
                    style={({ pressed }) => [
                      styles.themeDropdownItem,
                      isSelected && {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                      !isLast && [
                        styles.themeDropdownItemBorder,
                        {
                          borderBottomColor: isDark
                            ? 'rgba(255, 255, 255, 0.05)'
                            : 'rgba(0, 0, 0, 0.06)',
                        },
                      ],
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View style={styles.themeItemLeft}>
                      <View
                        style={[
                          styles.themeColorDot,
                          {
                            backgroundColor: themeItem.accent,
                            borderColor: isDark
                              ? 'rgba(255, 255, 255, 0.2)'
                              : 'rgba(0, 0, 0, 0.12)',
                          },
                        ]}
                      >
                        {themeItem.key === 'system' && (
                          <MaterialCommunityIcons
                            name="theme-light-dark"
                            size={12}
                            color="#FFFFFF"
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.themeOptionTitle,
                          {
                            color: isSelected ? colors.primary : colors.text,
                            fontWeight: isSelected ? '700' : '500',
                            fontSize: 14 * scale,
                          },
                        ]}
                      >
                        {themeItem.title}
                      </Text>
                    </View>

                    {isSelected ? (
                      <MaterialCommunityIcons
                        name="check"
                        size={19}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </Section>

      {/* Section 4: ขนาดตัวอักษร + Live Preview Card */}
      <Section
        icon="format-size"
        gradientColors={['#F59E0B', '#D97706']}
        title={t.section_font_size}
        subtitle={t.section_font_size_sub}
        isDark={isDark}
        colors={colors}
        scale={scale}
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
    </>
  );
}
