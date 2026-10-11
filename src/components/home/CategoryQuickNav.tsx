import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { FeedGroup } from '../../config/categories';
import { getCategoryVisual } from '../../config/categoryVisuals';
import { useNews } from '../../store/NewsContext';

interface Props {
  groups: FeedGroup[];
  totalArticlesCount: number;
  onSelectCategory: (groupKey: string) => void;
}

export function CategoryQuickNav({ groups, totalArticlesCount, onSelectCategory }: Props) {
  const { colors, scale } = useNews();

  return (
    <View style={styles.container}>
      {/* 1. Header Bar */}
      <View style={[styles.headerRow, { borderBottomColor: colors.border }]}>
        <View style={styles.headerTitleWrap}>
          <View style={styles.badgePill}>
            <MaterialCommunityIcons name="view-grid" size={12 * scale} color="#FFFFFF" style={{ marginRight: 3 }} />
            <Text style={[styles.badgeText, { fontSize: 10.5 * scale }]}>หมวดหมู่ข่าวสาร</Text>
          </View>
          <Text numberOfLines={1} style={[styles.headerSubtitle, { color: colors.text, fontSize: 11.5 * scale }]}>
            แยกตามประเด็น
          </Text>
        </View>

        <Text style={[styles.countStat, { color: colors.muted, fontSize: 10.5 * scale }]}>
          {groups.length} หมวด • {totalArticlesCount} ข่าว
        </Text>
      </View>

      {/* 2. Horizontal Scrollable Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {groups.map((group) => {
          const visual = getCategoryVisual(group.key, group.label, group.color);
          return (
            <Pressable
              key={`nav-${group.key}`}
              onPress={() => onSelectCategory(group.key)}
              style={({ pressed }) => [
                styles.pillBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={visual.icon}
                size={14 * scale}
                color={group.color}
                style={{ marginRight: 5 }}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: colors.text, fontSize: 11.5 * scale },
                ]}
              >
                {visual.shortLabel}
              </Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F43F5E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  headerSubtitle: {
    fontWeight: '700',
  },
  countStat: {
    fontWeight: '600',
  },
  scrollView: {
    overflow: 'visible',
  },
  scrollContent: {
    gap: 8,
    paddingRight: 16,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pillText: {
    fontWeight: '600',
  },
});
