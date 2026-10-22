import React from 'react';
import { StyleSheet, View } from 'react-native';
import { UnderlineTabBar } from '../../../components/UnderlineTabBar';
import { LatestViewModel } from '../types';

interface CategoryTabBarProps {
  vm: LatestViewModel;
}

export function CategoryTabBar({ vm }: CategoryTabBarProps) {
  const indicatorColor =
    vm.activeGroupKey === 'all'
      ? '#0EA5E9'
      : vm.activeGroup?.color ?? '#2F6FED';

  return (
    <View style={styles.container}>
      <UnderlineTabBar
        scrollable
        tabs={vm.categoryTabs}
        activeKey={vm.activeGroupKey}
        onChange={vm.handleCategoryTabChange}
        indicatorColor={indicatorColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
});
