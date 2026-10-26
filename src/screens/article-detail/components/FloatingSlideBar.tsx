import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArticleDetailViewModel } from '../types';

interface FloatingSlideBarProps {
  vm: ArticleDetailViewModel;
}

export function FloatingSlideBar({ vm }: FloatingSlideBarProps) {
  const {
    insets,
    isDark,
    colors,
    scale,
    currentIndex,
    resolvedArticleList,
    categoryShortTitle,
    handlePrev,
    handleNext,
  } = vm;

  if (resolvedArticleList.length <= 1) {
    return null;
  }

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === resolvedArticleList.length - 1;

  return (
    <View
      style={[styles.floatingSlideBarWrap, { bottom: insets.bottom + 12 }]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.floatingSlideBar,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.94)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          },
        ]}
      >
        {/* Prev Button */}
        <Pressable
          hitSlop={8}
          disabled={isFirst}
          onPress={handlePrev}
          style={({ pressed }) => [
            styles.slideNavBtn,
            isFirst && styles.slideNavBtnDisabled,
            pressed && { opacity: 0.6 },
          ]}
          accessibilityLabel="ข่าวก่อนหน้า"
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={22}
            color={isFirst ? (isDark ? '#475569' : '#CBD5E1') : colors.primary}
          />
          <Text
            style={[
              styles.slideNavBtnText,
              {
                color: isFirst ? (isDark ? '#475569' : '#CBD5E1') : colors.primary,
                fontSize: 12 * scale,
              },
            ]}
          >
            ก่อนหน้า
          </Text>
        </Pressable>

        <View
          style={[
            styles.slideDivider,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
          ]}
        />

        {/* Center Info with Category & Index */}
        <View style={styles.slideCenterInfo}>
          <View style={styles.slideCounterRow}>
            <MaterialCommunityIcons name="swap-horizontal" size={13} color={colors.primary} />
            <Text
              numberOfLines={1}
              style={[
                styles.slideCategoryText,
                { color: colors.primary, fontSize: 10.5 * scale },
              ]}
            >
              {categoryShortTitle}
            </Text>
            <Text style={[styles.slideCounterText, { color: colors.text, fontSize: 11 * scale }]}>
              ({currentIndex + 1}/{resolvedArticleList.length})
            </Text>
          </View>
          <Text style={[styles.slideHintText, { color: colors.muted, fontSize: 9 * scale }]}>
            ปัดซ้าย-ขวา
          </Text>
        </View>

        <View
          style={[
            styles.slideDivider,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' },
          ]}
        />

        {/* Next Button */}
        <Pressable
          hitSlop={8}
          disabled={isLast}
          onPress={handleNext}
          style={({ pressed }) => [
            styles.slideNavBtn,
            isLast && styles.slideNavBtnDisabled,
            pressed && { opacity: 0.6 },
          ]}
          accessibilityLabel="ข่าวถัดไป"
        >
          <Text
            style={[
              styles.slideNavBtnText,
              {
                color: isLast ? (isDark ? '#475569' : '#CBD5E1') : colors.primary,
                fontSize: 12 * scale,
              },
            ]}
          >
            ถัดไป
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={isLast ? (isDark ? '#475569' : '#CBD5E1') : colors.primary}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingSlideBarWrap: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 90,
  },
  floatingSlideBar: {
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    elevation: 6,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
  },
  slideNavBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  slideNavBtnDisabled: {
    opacity: 0.35,
  },
  slideNavBtnText: {
    fontWeight: '700',
  },
  slideDivider: {
    height: 18,
    width: StyleSheet.hairlineWidth,
  },
  slideCenterInfo: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  slideCategoryText: {
    fontWeight: '700',
  },
  slideCounterRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  slideCounterText: {
    fontWeight: '800',
  },
  slideHintText: {
    fontWeight: '500',
  },
});
