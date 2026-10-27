import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FeedSource } from '../../../config';
import { useNews } from '../../../store/NewsContext';

interface SourceQuickNavProps {
  sources: { source: FeedSource; articles: any[] }[];
  accentColor?: string;
  onSelectSource: (sourceKey: string) => void;
}

export function SourceQuickNav({
  sources,
  accentColor = '#0EA5E9',
  onSelectSource,
}: SourceQuickNavProps) {
  const { colors, scale, isDark } = useNews();

  if (sources.length === 0) return null;

  const totalCount = sources.reduce((acc, s) => acc + s.articles.length, 0);

  return (
    <View style={styles.container}>
      {/* Header Row */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleWrap}>
          <View style={[styles.badgePill, { backgroundColor: accentColor }]}>
            <MaterialCommunityIcons
              name="newspaper"
              size={12 * scale}
              color="#FFFFFF"
              style={{ marginRight: 3 }}
            />
            <Text style={[styles.badgeText, { fontSize: 10.5 * scale }]}>สำนักข่าว</Text>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.headerSubtitle, { color: colors.text, fontSize: 11.5 * scale }]}
          >
            แยกตามสำนักข่าว
          </Text>
        </View>

        <Text style={[styles.countStat, { color: colors.muted, fontSize: 10.5 * scale }]}>
          {sources.length} แหล่งข่าว • {totalCount} ข่าว
        </Text>
      </View>

      {/* Horizontal Scrollable Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {sources.map(({ source, articles }) => {
          return (
            <Pressable
              key={`source-nav-${source.key}`}
              onPress={() => onSelectSource(source.key)}
              style={({ pressed }) => [
                styles.pillBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              hitSlop={4}
            >
              <View style={[styles.dot, { backgroundColor: accentColor }]} />
              <Text
                numberOfLines={1}
                style={[styles.pillLabel, { color: colors.text, fontSize: 11.5 * scale }]}
              >
                {source.label}
              </Text>
              <View style={[styles.pillBadge, { backgroundColor: `${accentColor}1A` }]}>
                <Text style={[styles.pillBadgeText, { color: accentColor, fontSize: 10 * scale }]}>
                  {articles.length}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontWeight: '700',
  },
  countStat: {
    fontWeight: '600',
  },
  scrollView: {
    marginHorizontal: -16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillLabel: {
    fontWeight: '700',
  },
  pillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  pillBadgeText: {
    fontWeight: '800',
  },
});
