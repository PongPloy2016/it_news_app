import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { withAlpha } from '../constants';
import { LatestViewModel } from '../types';

interface SourceTabBarProps {
  vm: LatestViewModel;
}

export function SourceTabBar({ vm }: SourceTabBarProps) {
  const { activeSources, selectedFeedKey, activeGroup, colors, scale, handleSourceSelect } = vm;

  if (!activeSources || activeSources.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.subTabBar}
      style={styles.subTabBarWrap}
    >
      {activeSources.map((feed) => {
        const active = feed.key === selectedFeedKey;
        const isAggregate = feed.type === 'aggregate';
        const groupColor = activeGroup?.color ?? '#2F6FED';

        return (
          <Pressable
            key={feed.key}
            onPress={() => handleSourceSelect(feed.key)}
            style={[
              styles.subTabItem,
              {
                backgroundColor: active
                  ? groupColor
                  : isAggregate
                  ? withAlpha(groupColor, 0.12)
                  : colors.surface,
                borderColor: active
                  ? groupColor
                  : isAggregate
                  ? withAlpha(groupColor, 0.4)
                  : colors.border,
              },
            ]}
          >
            {isAggregate && (
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={13 * scale}
                color={active ? '#FFFFFF' : groupColor}
                style={{ marginRight: 3 }}
              />
            )}
            <Text
              style={[
                styles.subTabLabel,
                {
                  color: active ? '#FFFFFF' : isAggregate ? groupColor : colors.text,
                  fontSize: 11.5 * scale,
                  fontWeight: active || isAggregate ? '700' : '500',
                },
              ]}
            >
              {feed.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  subTabBarWrap: {
    marginBottom: 12,
  },
  subTabBar: {
    gap: 6,
    paddingVertical: 2,
  },
  subTabItem: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  subTabLabel: {},
});
