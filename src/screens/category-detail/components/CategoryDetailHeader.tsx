import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryDetailViewModel } from '../types';

export function CategoryDetailHeader({ vm }: { vm: CategoryDetailViewModel }) {
  const { visual, colors, scale, goBack, openSearch } = vm;

  return (
    <View style={[styles.navHeader, { borderBottomColor: colors.border }]}>
      <Pressable
        hitSlop={12}
        onPress={goBack}
        style={[styles.navIconBtn, { backgroundColor: colors.surfaceVariant }]}
        accessibilityLabel="ย้อนกลับ"
      >
        <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
      </Pressable>

      <Text numberOfLines={1} style={[styles.navTitle, { color: colors.text, fontSize: 16.5 * scale }]}>
        {visual.shortLabel}
      </Text>

      <Pressable
        hitSlop={12}
        onPress={openSearch}
        style={[styles.navIconBtn, { backgroundColor: colors.surfaceVariant }]}
        accessibilityLabel="ค้นหาข่าว"
      >
        <MaterialCommunityIcons name="magnify" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  navHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 52,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  navIconBtn: {
    alignItems: 'center',
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  navTitle: {
    flex: 1,
    fontWeight: '800',
    marginHorizontal: 12,
    textAlign: 'center',
  },
});
