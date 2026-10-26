import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CategoryDetailViewModel } from '../types';

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function CategoryHeroBanner({ vm }: { vm: CategoryDetailViewModel }) {
  const { currentGroup, visual, sources, colors, scale } = vm;

  return (
    <View
      style={[
        styles.heroBanner,
        {
          backgroundColor: visual.color,
          borderColor: withAlpha(colors.border, 0.4),
        },
      ]}
    >
      <Image source={{ uri: visual.image }} style={styles.heroImage} resizeMode="cover" />
      <View style={styles.heroOverlay} />

      <View style={styles.heroContent}>
        <View style={[styles.heroIconBadge, { backgroundColor: withAlpha(visual.color, 0.9) }]}>
          <MaterialCommunityIcons name={visual.icon} size={22} color="#FFFFFF" />
        </View>
        <Text style={[styles.heroTitle, { fontSize: 20 * scale }]}>
          {currentGroup?.label ?? visual.shortLabel}
        </Text>
        <Text style={[styles.heroTagline, { fontSize: 12.5 * scale }]}>
          {visual.tagline} · มีทั้งหมด {sources.filter((s) => s.type !== 'aggregate').length} แหล่งข่าว
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroBanner: {
    borderRadius: 16,
    borderWidth: 1,
    height: 140,
    marginHorizontal: 14,
    marginTop: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
    height: '100%',
    width: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  heroContent: {
    bottom: 14,
    gap: 4,
    left: 16,
    position: 'absolute',
    right: 16,
    zIndex: 2,
  },
  heroIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 36,
    justifyContent: 'center',
    marginBottom: 2,
    width: 36,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  heroTagline: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
});
