import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { withAlpha } from '../constants';
import { LatestViewModel } from '../types';

interface StatusFilterBarProps {
  vm: LatestViewModel;
}

export function StatusFilterBar({ vm }: StatusFilterBarProps) {
  const {
    statusFilter,
    setStatusFilter,
    articles,
    newArticlesCount,
    readArticlesCount,
    colors,
    scale,
  } = vm;

  return (
    <View style={styles.statusFilterBar}>
      <Pressable
        onPress={() => setStatusFilter('all')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'all' ? colors.primary : colors.surfaceVariant,
            borderColor: statusFilter === 'all' ? colors.primary : colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'all' ? '#FFFFFF' : colors.text,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'all' ? '800' : '600',
            },
          ]}
        >
          ทั้งหมด ({articles.length})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setStatusFilter('new')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'new' ? '#EF4444' : colors.surfaceVariant,
            borderColor:
              statusFilter === 'new'
                ? '#EF4444'
                : newArticlesCount > 0
                ? withAlpha('#EF4444', 0.5)
                : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="fire"
          size={13 * scale}
          color={statusFilter === 'new' ? '#FFFFFF' : '#EF4444'}
        />
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'new' ? '#FFFFFF' : colors.text,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'new' ? '800' : '600',
            },
          ]}
        >
          ข่าวใหม่ ({newArticlesCount})
        </Text>
      </Pressable>

      <Pressable
        onPress={() => setStatusFilter('read')}
        style={[
          styles.statusChip,
          {
            backgroundColor: statusFilter === 'read' ? colors.muted : colors.surfaceVariant,
            borderColor: statusFilter === 'read' ? colors.muted : colors.border,
          },
        ]}
      >
        <MaterialCommunityIcons
          name="check"
          size={13 * scale}
          color={statusFilter === 'read' ? '#FFFFFF' : colors.muted}
        />
        <Text
          style={[
            styles.statusChipText,
            {
              color: statusFilter === 'read' ? '#FFFFFF' : colors.muted,
              fontSize: 11.5 * scale,
              fontWeight: statusFilter === 'read' ? '800' : '600',
            },
          ]}
        >
          อ่านแล้ว ({readArticlesCount})
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  statusFilterBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  statusChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {},
});
