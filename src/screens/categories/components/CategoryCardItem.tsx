import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryGroupWithStats } from '../types';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 12;
const PADDING_H = 16;
const CARD_WIDTH = (SCREEN_WIDTH - PADDING_H * 2 - CARD_GAP) / 2;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 1.15);

interface CategoryCardItemProps {
  item: CategoryGroupWithStats;
  onPress: () => void;
  colors: any;
  scale: number;
  isDark: boolean;
}

export function CategoryCardItem({ item, onPress, colors, scale, isDark }: CategoryCardItemProps) {
  const { visual, newCount, sourceCount } = item;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: visual.color,
          borderColor: withAlpha(colors.border, isDark ? 0.35 : 0.2),
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {/* Card Background Image with overlay */}
      <Image source={{ uri: visual.image }} style={styles.cardImage} resizeMode="cover" />

      {/* Gradient dark overlay */}
      <View style={styles.cardGradientOverlay} />

      {/* Top Header inside Card */}
      <View style={styles.cardTopRow}>
        <View style={[styles.iconBadge, { backgroundColor: withAlpha(visual.color, 0.88) }]}>
          <MaterialCommunityIcons name={visual.icon} size={18} color="#FFFFFF" />
        </View>

        {newCount > 0 ? (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{newCount} ใหม่</Text>
          </View>
        ) : (
          <View style={styles.sourceCountBadge}>
            <Text style={styles.sourceCountText}>{sourceCount} ช่อง</Text>
          </View>
        )}
      </View>

      {/* Bottom Content inside Card */}
      <View style={styles.cardBottomContent}>
        <Text numberOfLines={2} style={[styles.cardTitle, { fontSize: 16.5 * scale }]}>
          {visual.shortLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
    width: CARD_WIDTH,
  },
  cardImage: {
    ...StyleSheet.absoluteFill,
    height: '100%',
    width: '100%',
  },
  cardGradientOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  cardTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 12,
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 2,
  },
  iconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  sourceCountBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourceCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  newBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardBottomContent: {
    bottom: 14,
    left: 14,
    position: 'absolute',
    right: 14,
    zIndex: 2,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
});
