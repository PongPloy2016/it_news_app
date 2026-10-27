import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { UnderlineTabBar } from '../../../components/UnderlineTabBar';
import { LatestViewModel } from '../types';

interface CategoryTabBarProps {
  vm: LatestViewModel;
}

export function CategoryTabBar({ vm }: CategoryTabBarProps) {
  const navigation = useNavigation<any>();
  const indicatorColor =
    vm.activeGroupKey === 'all'
      ? '#0EA5E9'
      : vm.activeGroup?.color ?? '#2F6FED';

  const handleOpenDrawerMenu = () => {
    try {
      navigation.dispatch(DrawerActions.openDrawer());
    } catch {
      navigation.getParent()?.dispatch(DrawerActions.openDrawer());
    }
  };

  return (
    <View style={styles.container}>
      <UnderlineTabBar
        scrollable
        tabs={vm.categoryTabs}
        activeKey={vm.activeGroupKey}
        onChange={vm.handleCategoryTabChange}
        indicatorColor={indicatorColor}
        onPressMenu={handleOpenDrawerMenu}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
});
