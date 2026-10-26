import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryDetailViewModel } from '../types';

export function CategorySourcesTabBar({ vm }: { vm: CategoryDetailViewModel }) {
  const {
    sources,
    selectedSourceKey,
    visual,
    colors,
    scale,
    channelStats,
    handleSelectSource,
  } = vm;

  return (
    <View style={styles.sourcesSection}>
      <View style={styles.sourcesHeaderRow}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 15 * scale }]}>
          ช่องข่าวในหมวดหมู่นี้
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.muted, fontSize: 11.5 * scale }]}>
          เลือกเพื่อกรองข่าว
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sourcesScroll}
      >
        {/* Option All */}
        <Pressable
          onPress={() => handleSelectSource('all')}
          style={[
            styles.sourceCard,
            {
              backgroundColor: selectedSourceKey === 'all' ? visual.color : colors.surfaceVariant,
              borderColor: selectedSourceKey === 'all' ? visual.color : colors.border,
            },
          ]}
        >
          <View style={styles.sourceCardTop}>
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={16}
              color={selectedSourceKey === 'all' ? '#FFFFFF' : visual.color}
            />
            <Text
              style={[
                styles.sourceCardTitle,
                {
                  color: selectedSourceKey === 'all' ? '#FFFFFF' : colors.text,
                  fontWeight: '800',
                },
              ]}
            >
              รวมทั้งหมด
            </Text>
          </View>
          <Text
            style={[
              styles.sourceCardSub,
              { color: selectedSourceKey === 'all' ? 'rgba(255,255,255,0.85)' : colors.muted },
            ]}
          >
            ทุกสำนักข่าว
          </Text>
        </Pressable>

        {/* Individual Source Cards */}
        {sources
          .filter((s) => s.type !== 'aggregate')
          .map((source) => {
            const isSelected = selectedSourceKey === source.key;
            const stat = channelStats[source.key];
            const newCount = stat?.newCount ?? 0;

            return (
              <Pressable
                key={source.key}
                onPress={() => handleSelectSource(source.key)}
                style={[
                  styles.sourceCard,
                  {
                    backgroundColor: isSelected ? visual.color : colors.surfaceVariant,
                    borderColor: isSelected ? visual.color : colors.border,
                  },
                ]}
              >
                <View style={styles.sourceCardTop}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.sourceCardTitle,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '800' : '700',
                      },
                    ]}
                  >
                    {source.label}
                  </Text>
                  {newCount > 0 && (
                    <View style={styles.sourceNewDot}>
                      <Text style={styles.sourceNewDotText}>{newCount}</Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.sourceCardSub,
                    { color: isSelected ? 'rgba(255,255,255,0.85)' : colors.muted },
                  ]}
                >
                  {source.type.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sourcesSection: {
    marginTop: 16,
  },
  sourcesHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontWeight: '500',
  },
  sourcesScroll: {
    gap: 8,
    paddingHorizontal: 14,
  },
  sourceCard: {
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    minWidth: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sourceCardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  sourceCardTitle: {
    fontSize: 13,
  },
  sourceNewDot: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  sourceNewDotText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  sourceCardSub: {
    fontSize: 10.5,
    fontWeight: '600',
  },
});
