import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenState } from '../../../components/ScreenState';
import { SearchViewModel } from '../types';

export function SearchHistoryView({ vm }: { vm: SearchViewModel }) {
  const { searchHistory, colors, scale, handleHistoryPress, handleClearSearchHistory } = vm;

  if (!searchHistory.length) {
    return (
      <ScreenState
        icon="text-search"
        title="ค้นหาข่าวสาร"
        subtitle="ค้นหาจากข่าวที่ดาวน์โหลดไว้ ตามหัวข้อ เนื้อหา หรือชื่อผู้เขียน"
      />
    );
  }

  return (
    <View style={styles.history}>
      <View style={styles.historyHeading}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 16 * scale }]}>
          การค้นหาล่าสุด
        </Text>
        <Pressable onPress={handleClearSearchHistory}>
          <Text style={{ color: colors.primary }}>ล้างทั้งหมด</Text>
        </Pressable>
      </View>
      <View style={styles.chips}>
        {searchHistory.map((item) => (
          <Pressable
            key={item}
            onPress={() => handleHistoryPress(item)}
            style={[styles.chip, { backgroundColor: colors.surfaceVariant }]}
          >
            <Text style={{ color: colors.text, fontSize: 13 * scale }}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  history: {
    paddingTop: 20,
  },
  historyHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
});
