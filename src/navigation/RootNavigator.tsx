import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerActions, getFocusedRouteNameFromRoute, RouteProp } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ScrollView as GHScrollView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { CategoryDetailScreen } from '../screens/CategoryDetailScreen';
import { LatestScreen } from '../screens/LatestScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { useNews } from '../store/NewsContext';
import { MainTabParamList, RootStackParamList } from '../types';
import { formatRelative } from '../utils/content';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator();

const withAlpha = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const safe = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const value = Number.parseInt(safe, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function DrawerContent(props: DrawerContentComponentProps) {
  const {
    feedGroups,
    colors,
    scale,
    selectedFeedKey,
    setSelectedFeedKey,
    bookmarks,
    isDark,
    setThemeMode,
    lastUpdated,
    refresh,
    isRefreshing,
    articles,
    channelStats,
    isArticleNew,
  } = useNews();
  const insets = useSafeAreaInsets();

  const bookmarkCount = Object.keys(bookmarks).length;
  const [filterGroupKey, setFilterGroupKey] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const closeDrawer = () => {
    props.navigation.dispatch(DrawerActions.closeDrawer());
  };

  const navigateToTab = (screenName: keyof MainTabParamList) => {
    closeDrawer();
    setTimeout(() => {
      (props.navigation as any).navigate('DrawerHome', { screen: screenName });
    }, 60);
  };

  // Build list of channels with their parent group color
  const channels = useMemo(() => {
    return feedGroups.flatMap((group) =>
      group.sources.map((source) => ({
        ...source,
        groupKey: group.key,
        groupLabel: group.label,
        groupColor: group.color,
      }))
    );
  }, [feedGroups]);

  // Find active group based on currently selected feed
  const activeGroupKey = useMemo(() => {
    for (const group of feedGroups) {
      if (group.sources.some((s) => s.key === selectedFeedKey)) {
        return group.key;
      }
    }
    return feedGroups[0]?.key || 'tech-business';
  }, [feedGroups, selectedFeedKey]);

  // Keep the active group open by default, collapse others
  useEffect(() => {
    setCollapsedGroups((prev) => {
      if (Object.keys(prev).length > 0) return prev;
      const initial: Record<string, boolean> = {};
      for (const group of feedGroups) {
        initial[group.key] = group.key !== activeGroupKey;
      }
      return initial;
    });
  }, [feedGroups, activeGroupKey]);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const displayedGroups = useMemo(() => {
    if (filterGroupKey === 'all') return feedGroups;
    return feedGroups.filter((g) => g.key === filterGroupKey);
  }, [feedGroups, filterGroupKey]);

  const areAllExpanded = displayedGroups.every((g) => !collapsedGroups[g.key]);

  const toggleExpandAll = () => {
    const nextState = areAllExpanded;
    const updated: Record<string, boolean> = { ...collapsedGroups };
    for (const g of displayedGroups) {
      updated[g.key] = nextState;
    }
    setCollapsedGroups(updated);
  };

  const getShortLabel = (label: string) => {
    return label.replace(/^ข่าว/, '').replace(/และธุรกิจดิจิทัล/, ' & ธุรกิจ');
  };

  const getCategoryIcon = (key: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    switch (key) {
      case 'tech-business':
        return 'laptop';
      case 'international':
        return 'earth';
      case 'thai-news':
        return 'newspaper-variant-outline';
      case 'mobile':
        return 'cellphone';
      case 'computer-games':
        return 'gamepad-variant-outline';
      default:
        return 'folder-outline';
    }
  };

  const renderChannelRow = (channel: (typeof channels)[number]) => {
    const isSelected = channel.key === selectedFeedKey;
    const stat = channelStats[channel.key];
    const newCount = isSelected ? articles.filter(isArticleNew).length : (stat?.newCount ?? 0);
    const hasNew = newCount > 0;
    const isAggregate = channel.type === 'aggregate';

    return (
      <Pressable
        key={`${channel.groupKey}-${channel.key}`}
        onPress={() => {
          setSelectedFeedKey(channel.key);
          closeDrawer();
        }}
        style={({ pressed }) => [
          styles.channelRow,
          {
            backgroundColor: isSelected
              ? withAlpha(channel.groupColor, 0.16)
              : isAggregate
              ? withAlpha(channel.groupColor, 0.05)
              : pressed
              ? withAlpha(channel.groupColor, 0.08)
              : 'transparent',
            borderBottomColor: withAlpha(colors.border, 0.4),
          },
        ]}
      >
        {/* Left accent indicator bar */}
        <View
          style={[
            styles.channelIndicatorBar,
            {
              backgroundColor: isSelected ? channel.groupColor : isAggregate ? channel.groupColor : 'transparent',
            },
          ]}
        />

        {/* Channel Name */}
        <View style={styles.channelNameWrap}>
          {isAggregate ? (
            <MaterialCommunityIcons name="lightning-bolt" size={15} color={channel.groupColor} style={{ marginRight: 4 }} />
          ) : (
            <View style={[styles.channelDot, { backgroundColor: withAlpha(channel.groupColor, isSelected ? 1 : 0.45) }]} />
          )}
          <Text
            numberOfLines={1}
            style={[
              styles.channelName,
              {
                color: isSelected ? channel.groupColor : colors.text,
                fontWeight: isSelected ? '800' : isAggregate ? '700' : '500',
                fontSize: 13.5 * scale,
              },
            ]}
          >
            {isAggregate
              ? `รวมข่าว${channel.groupLabel.replace('ข่าว', '')}`
              : channel.label}
          </Text>
          {hasNew && <View style={styles.channelNewDot} />}
        </View>

        {/* Right count / badge */}
        <View style={styles.channelCountWrap}>
          {hasNew ? (
            <View style={styles.drawerNewBadge}>
              <Text style={styles.drawerNewBadgeText}>{newCount} ใหม่</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.channelCount,
                {
                  color: isSelected ? channel.groupColor : colors.muted,
                  fontWeight: isSelected ? '800' : '500',
                  fontSize: 12 * scale,
                },
              ]}
            >
              {isSelected ? `${articles.length || 50}` : `${stat?.total ?? 50}`}
            </Text>
          )}
          {isSelected && (
            <MaterialCommunityIcons name="check-circle" size={15} color={channel.groupColor} style={{ marginLeft: 6 }} />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      {/* 1. Modern Unified Header */}
      <View style={[styles.topHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.topHeaderLeft}>
          <View style={styles.titleRow}>
            <Text style={[styles.drawerTitle, { color: colors.text, fontSize: 16 * scale }]}>
              หมวดหมู่ข่าวสาร
            </Text>
            <View style={[styles.totalCountBadge, { backgroundColor: withAlpha(colors.primary, 0.14) }]}>
              <Text style={[styles.totalCountText, { color: colors.primary, fontSize: 11 * scale }]}>
                {channels.length} ช่อง
              </Text>
            </View>
          </View>
          <View style={styles.updateRow}>
            <View style={styles.liveDot} />
            <Text style={[styles.updateText, { color: colors.muted, fontSize: 11 * scale }]}>
              อัปเดต : {lastUpdated ? formatRelative(lastUpdated) : 'เมื่อสักครู่'}
            </Text>
          </View>
        </View>

        <View style={styles.topHeaderActions}>
          <Pressable
            hitSlop={8}
            onPress={() => void refresh(true)}
            disabled={isRefreshing}
            style={[styles.headerActionCircle, { backgroundColor: colors.surfaceVariant }]}
            accessibilityLabel="รีเฟรชข่าว"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="reload" size={18} color={colors.text} />
            )}
          </Pressable>

          <Pressable
            hitSlop={8}
            onPress={closeDrawer}
            style={[styles.headerActionCircle, { backgroundColor: colors.surfaceVariant, marginLeft: 6 }]}
            accessibilityLabel="ปิดเมนูข้าง"
          >
            <MaterialCommunityIcons name="close" size={18} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* 2. Modern Category Quick-Filter Module Pills (GestureHandler ScrollView with disallowInterruption) */}
      <View style={[styles.filterBarContainer, { borderBottomColor: colors.border }]}>
        <GHScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          nestedScrollEnabled={true}
          disallowInterruption={true}
          contentContainerStyle={styles.filterScroll}
          style={styles.filterScrollView}
        >
          <Pressable
            onPress={() => {
              setFilterGroupKey('all');
              setIsCategoryPickerOpen(false);
            }}
            style={[
              styles.filterPill,
              {
                backgroundColor: filterGroupKey === 'all' ? colors.primary : colors.surfaceVariant,
                borderColor: filterGroupKey === 'all' ? colors.primary : colors.border,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="view-grid-outline"
              size={13}
              color={filterGroupKey === 'all' ? '#FFFFFF' : colors.muted}
            />
            <Text
              style={[
                styles.filterPillText,
                {
                  color: filterGroupKey === 'all' ? '#FFFFFF' : colors.muted,
                  fontWeight: filterGroupKey === 'all' ? '800' : '600',
                  fontSize: 11.5 * scale,
                },
              ]}
            >
              ทั้งหมด ({channels.length})
            </Text>
          </Pressable>

          {feedGroups.map((group) => {
            const isSelected = filterGroupKey === group.key;
            return (
              <Pressable
                key={group.key}
                onPress={() => {
                  setFilterGroupKey(group.key);
                  setCollapsedGroups((prev) => ({ ...prev, [group.key]: false }));
                  setIsCategoryPickerOpen(false);
                }}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? group.color : colors.surfaceVariant,
                    borderColor: isSelected ? group.color : colors.border,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={getCategoryIcon(group.key)}
                  size={13}
                  color={isSelected ? '#FFFFFF' : group.color}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: 11.5 * scale,
                    },
                  ]}
                >
                  {getShortLabel(group.label)} ({group.sources.length})
                </Text>
              </Pressable>
            );
          })}
        </GHScrollView>

        {/* Quick Dropdown Toggle Button on the right */}
        <Pressable
          hitSlop={8}
          onPress={() => setIsCategoryPickerOpen((prev) => !prev)}
          style={[
            styles.filterDropdownToggle,
            {
              backgroundColor: isCategoryPickerOpen ? withAlpha(colors.primary, 0.15) : colors.surfaceVariant,
              borderColor: isCategoryPickerOpen ? colors.primary : colors.border,
            },
          ]}
          accessibilityLabel="เมนูเลือกหมวดหมู่"
        >
          <MaterialCommunityIcons
            name={isCategoryPickerOpen ? 'chevron-up' : 'format-list-bulleted'}
            size={16}
            color={isCategoryPickerOpen ? colors.primary : colors.muted}
          />
        </Pressable>
      </View>

      {/* Quick Dropdown Picker Menu Popup */}
      {isCategoryPickerOpen && (
        <View
          style={[
            styles.pickerMenuCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              ...Platform.select({
                android: { elevation: 8 },
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                },
              }),
            },
          ]}
        >
          {/* Option All */}
          <Pressable
            onPress={() => {
              setFilterGroupKey('all');
              setIsCategoryPickerOpen(false);
            }}
            style={[
              styles.pickerMenuItem,
              filterGroupKey === 'all' && { backgroundColor: withAlpha(colors.primary, 0.12) },
              { borderBottomColor: colors.border },
            ]}
          >
            <View style={styles.pickerMenuItemLeft}>
              <View style={[styles.pickerMenuDot, { backgroundColor: colors.primary }]} />
              <Text
                style={[
                  styles.pickerMenuItemText,
                  {
                    color: filterGroupKey === 'all' ? colors.primary : colors.text,
                    fontWeight: filterGroupKey === 'all' ? '800' : '600',
                    fontSize: 12.5 * scale,
                  },
                ]}
              >
                ทั้งหมด (ทุกหมวดหมู่)
              </Text>
            </View>
            <Text style={[styles.pickerMenuCount, { color: colors.muted, fontSize: 11.5 * scale }]}>
              {channels.length} ช่อง
            </Text>
          </Pressable>

          {/* Each Group */}
          {feedGroups.map((group) => {
            const isSelected = filterGroupKey === group.key;
            return (
              <Pressable
                key={group.key}
                onPress={() => {
                  setFilterGroupKey(group.key);
                  setCollapsedGroups((prev) => ({ ...prev, [group.key]: false }));
                  setIsCategoryPickerOpen(false);
                }}
                style={[
                  styles.pickerMenuItem,
                  isSelected && { backgroundColor: withAlpha(group.color, 0.12) },
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.pickerMenuItemLeft}>
                  <View style={[styles.pickerMenuDot, { backgroundColor: group.color }]} />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.pickerMenuItemText,
                      {
                        color: isSelected ? group.color : colors.text,
                        fontWeight: isSelected ? '800' : '600',
                        fontSize: 12.5 * scale,
                      },
                    ]}
                  >
                    {group.label}
                  </Text>
                </View>
                <Text style={[styles.pickerMenuCount, { color: colors.muted, fontSize: 11.5 * scale }]}>
                  {group.sources.length} ช่อง
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* 3. Section Action Bar (Expand/Collapse All) */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeaderText, { color: colors.muted, fontSize: 11.5 * scale }]}>
          โมดูลหมวดหมู่ ({displayedGroups.length})
        </Text>
        <Pressable
          onPress={toggleExpandAll}
          hitSlop={8}
          style={styles.expandAllBtn}
        >
          <MaterialCommunityIcons
            name={areAllExpanded ? 'arrow-collapse-vertical' : 'arrow-expand-vertical'}
            size={13}
            color={colors.primary}
          />
          <Text style={[styles.expandAllText, { color: colors.primary, fontSize: 11 * scale }]}>
            {areAllExpanded ? 'ย่อทั้งหมด' : 'ขยายทั้งหมด'}
          </Text>
        </Pressable>
      </View>

      {/* 4. Modular Category Cards (Card Modules) */}
      <GHScrollView
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        contentContainerStyle={styles.channelScrollContent}
        style={styles.channelScrollView}
      >
        {displayedGroups.map((group) => {
          const isCollapsed = Boolean(collapsedGroups[group.key]);
          const groupChannels = channels.filter((c) => c.groupKey === group.key);
          const hasSelectedChannel = groupChannels.some((c) => c.key === selectedFeedKey);
          const groupNewCount = groupChannels.reduce((sum, c) => {
            const stat = channelStats[c.key];
            const n = c.key === selectedFeedKey ? articles.filter(isArticleNew).length : (stat?.newCount ?? 0);
            return sum + (n > 0 ? n : 0);
          }, 0);

          return (
            <View
              key={group.key}
              style={[
                styles.moduleCard,
                {
                  backgroundColor: colors.surfaceVariant,
                  borderColor: hasSelectedChannel
                    ? group.color
                    : withAlpha(group.color, isCollapsed ? 0.2 : 0.45),
                },
              ]}
            >
              {/* Module Header Tile */}
              <Pressable
                onPress={() => toggleGroupCollapse(group.key)}
                style={({ pressed }) => [
                  styles.moduleHeader,
                  {
                    backgroundColor: pressed
                      ? withAlpha(group.color, 0.12)
                      : withAlpha(group.color, hasSelectedChannel ? 0.08 : 0.04),
                    borderBottomColor: withAlpha(colors.border, 0.5),
                    borderBottomWidth: !isCollapsed ? StyleSheet.hairlineWidth : 0,
                  },
                ]}
              >
                <View style={styles.moduleHeaderLeft}>
                  <View style={[styles.moduleIconBadge, { backgroundColor: group.color }]}>
                    <MaterialCommunityIcons name={getCategoryIcon(group.key)} size={17} color="#FFFFFF" />
                  </View>
                  <View style={styles.moduleTitleWrap}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.moduleTitleText,
                        {
                          color: colors.text,
                          fontWeight: hasSelectedChannel ? '800' : '700',
                          fontSize: 13.5 * scale,
                        },
                      ]}
                    >
                      {group.label}
                    </Text>
                    <Text style={[styles.moduleSubtitleText, { color: colors.muted, fontSize: 11 * scale }]}>
                      {group.sources.length} ช่องข่าว {groupNewCount > 0 ? `· ${groupNewCount} ข่าวใหม่` : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.moduleHeaderRight}>
                  {groupNewCount > 0 && (
                    <View style={styles.groupNewBadge}>
                      <Text style={styles.groupNewBadgeText}>{groupNewCount}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.chevronCircle,
                      { backgroundColor: withAlpha(colors.text, 0.06) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                      size={18}
                      color={isCollapsed ? colors.muted : group.color}
                    />
                  </View>
                </View>
              </Pressable>

              {/* Module Channels List */}
              {!isCollapsed && (
                <View style={styles.moduleContent}>
                  {groupChannels.map(renderChannelRow)}
                </View>
              )}
            </View>
          );
        })}
      </GHScrollView>

      {/* 5. Minimal Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        <Pressable
          hitSlop={8}
          onPress={() => navigateToTab('Bookmarks')}
          style={styles.bottomBarItem}
        >
          <MaterialCommunityIcons name="bookmark-outline" size={18} color={colors.primary} />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11 * scale }]}>
            บันทึก ({bookmarkCount})
          </Text>
        </Pressable>

        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />

        <Pressable
          hitSlop={8}
          onPress={() => navigateToTab('Search')}
          style={styles.bottomBarItem}
        >
          <MaterialCommunityIcons name="magnify" size={18} color={colors.primary} />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11 * scale }]}>
            ค้นหา
          </Text>
        </Pressable>

        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />

        <Pressable
          hitSlop={8}
          onPress={() => setThemeMode(isDark ? 'light' : 'dark')}
          style={styles.bottomBarItem}
        >
          <MaterialCommunityIcons
            name={isDark ? 'weather-night' : 'white-balance-sunny'}
            size={18}
            color={isDark ? '#8DB9FF' : '#F59E0B'}
          />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11 * scale }]}>
            {isDark ? 'มืด' : 'สว่าง'}
          </Text>
        </Pressable>

        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />

        <Pressable
          hitSlop={8}
          onPress={() => navigateToTab('Settings')}
          style={styles.bottomBarItem}
        >
          <MaterialCommunityIcons name="cog-outline" size={18} color={colors.muted} />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11 * scale }]}>
            ตั้งค่า
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function MainTabs() {
  const { colors, scale } = useNews();
  const insets = useSafeAreaInsets();

  const bottomInset = insets.bottom;
  const paddingBottom = Math.max(bottomInset, 8);
  const tabHeight = 58 + paddingBottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabHeight,
          paddingBottom: paddingBottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11 * scale,
        },
      }}
    >
      <Tab.Screen
        name="Latest"
        component={LatestScreen}
        options={{
          title: 'ข่าวล่าสุด',
          tabBarLabel: 'ข่าวล่าสุด',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{
          title: 'หมวดหมู่',
          tabBarLabel: 'หมวดหมู่',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'ค้นหา',
          tabBarLabel: 'ค้นหา',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="magnify" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{
          title: 'บันทึก',
          tabBarLabel: 'บันทึก',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'ตั้งค่า',
          tabBarLabel: 'ตั้งค่า',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function getDrawerHeaderTitle(route: RouteProp<Record<string, object | undefined>, string>): string {
  const routeName = getFocusedRouteNameFromRoute(route) ?? 'Latest';
  switch (routeName) {
    case 'Latest':
      return 'IT News App';
    case 'Categories':
      return 'หมวดหมู่ข่าวสาร';
    case 'Search':
      return 'ค้นหา';
    case 'Bookmarks':
      return 'บันทึก';
    case 'Settings':
      return 'ตั้งค่า';
    default:
      return 'IT News App';
  }
}

function MainDrawer() {
  const { colors, scale } = useNews();
  const screenWidth = Dimensions.get('window').width;
  const drawerWidth = Math.min(345, Math.round(screenWidth * 0.86));

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 18 * scale },
        drawerStyle: { backgroundColor: colors.surface, width: drawerWidth },
        drawerType: 'front',
        swipeEnabled: true,
        swipeEdgeWidth: 80,
        overlayColor: 'rgba(0, 0, 0, 0.55)',
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: { fontWeight: '700', fontSize: 14 * scale },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 10, marginVertical: 2 },
        headerLeft: () => (
          <Pressable
            hitSlop={12}
            style={{ marginLeft: 16 }}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          >
            <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
          </Pressable>
        ),
      })}
    >
      <Drawer.Screen
        name="DrawerHome"
        component={MainTabs}
        options={({ route }) => ({
          headerTitle: getDrawerHeaderTitle(route),
        })}
      />
    </Drawer.Navigator>
  );
}

export function RootNavigator() {
  const { colors, scale } = useNews();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 18 * scale },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={MainDrawer} options={{ headerShown: false }} />
      <Stack.Screen name="Article" component={ArticleDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="CategoryDetail"
        component={CategoryDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={({ route }) => ({ title: route.params.title ?? 'เปิดข่าว' })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
  },
  topHeader: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  drawerTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  totalCountBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  totalCountText: {
    fontWeight: '700',
  },
  updateRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  liveDot: {
    backgroundColor: '#10B981',
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  updateText: {
    fontWeight: '500',
  },
  topHeaderActions: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  headerActionCircle: {
    alignItems: 'center',
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  filterBarContainer: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingRight: 10,
  },
  filterScrollView: {
    flex: 1,
  },
  filterScroll: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  filterDropdownToggle: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginLeft: 4,
    width: 32,
  },
  pickerMenuCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    marginHorizontal: 12,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerMenuItem: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pickerMenuItemLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  pickerMenuDot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  pickerMenuItemText: {
    flex: 1,
    letterSpacing: -0.1,
  },
  pickerMenuCount: {
    fontWeight: '600',
  },
  filterPill: {
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
  },
  filterPillText: {
    letterSpacing: -0.2,
  },
  sectionHeaderRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  sectionHeaderText: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  expandAllBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  expandAllText: {
    fontWeight: '700',
  },
  channelScrollView: {
    flex: 1,
  },
  channelScrollContent: {
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 20,
  },
  moduleCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    overflow: 'hidden',
  },
  moduleHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  moduleHeaderLeft: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingRight: 6,
  },
  moduleIconBadge: {
    alignItems: 'center',
    borderRadius: 10,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  moduleTitleWrap: {
    flex: 1,
    gap: 2,
  },
  moduleTitleText: {
    letterSpacing: -0.2,
  },
  moduleSubtitleText: {
    fontWeight: '500',
  },
  moduleHeaderRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  groupNewBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  groupNewBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  chevronCircle: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  moduleContent: {
    borderTopWidth: 0,
  },
  channelRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 44,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    position: 'relative',
  },
  channelIndicatorBar: {
    borderRadius: 1.5,
    bottom: 6,
    left: 2,
    position: 'absolute',
    top: 6,
    width: 3,
  },
  channelNameWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 6,
    paddingRight: 6,
  },
  channelDot: {
    borderRadius: 999,
    height: 5,
    marginRight: 8,
    width: 5,
  },
  channelName: {
    letterSpacing: -0.2,
  },
  channelNewDot: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    height: 6,
    marginLeft: 6,
    width: 6,
  },
  channelCountWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  channelCount: {
    letterSpacing: 0.2,
  },
  drawerNewBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  drawerNewBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  bottomBar: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  bottomBarItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomBarText: {
    fontWeight: '600',
  },
  bottomDivider: {
    height: 20,
    width: StyleSheet.hairlineWidth,
  },
});
