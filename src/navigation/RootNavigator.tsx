import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerActions } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
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

  const filteredChannels = useMemo(() => {
    if (filterGroupKey === 'all') return channels;
    return channels.filter((c) => c.groupKey === filterGroupKey);
  }, [channels, filterGroupKey]);

  return (
    <View style={[styles.drawerContainer, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
      {/* 1. Japanese Style Top Bar: 最終更新 (Last Updated) + 🔄 Refresh + ✕ Close Button */}
      <View style={[styles.topBar, { backgroundColor: colors.surfaceVariant, borderBottomColor: colors.border }]}>
        <View style={styles.lastUpdateWrap}>
          <Text style={[styles.lastUpdateLabel, { color: colors.text, fontSize: 13 * scale }]}>
            อัปเดตล่าสุด : {lastUpdated ? formatRelative(lastUpdated) : 'เมื่อสักครู่'}
          </Text>
        </View>
        <View style={styles.topBarActions}>
          <Pressable
            hitSlop={12}
            onPress={() => void refresh(true)}
            disabled={isRefreshing}
            style={styles.headerIconBtn}
            accessibilityLabel="รีเฟรชข่าว"
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="reload" size={19} color={colors.muted} />
            )}
          </Pressable>

          <Pressable
            hitSlop={12}
            onPress={closeDrawer}
            style={[styles.headerIconBtn, { backgroundColor: withAlpha(colors.text, 0.08), marginLeft: 4 }]}
            accessibilityLabel="ปิดเมนูข้าง"
          >
            <MaterialCommunityIcons name="close" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* 2. Subheader Bar: チャンネル一覧 (Channels) + 新着順 (Latest) */}
      <View style={[styles.subHeaderBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.subHeaderTitle, { color: colors.muted, fontSize: 12 * scale }]}>
          ช่องข่าวทั้งหมด ({filteredChannels.length})
        </Text>
        <Text style={[styles.subHeaderSort, { color: colors.muted, fontSize: 11.5 * scale }]}>
          เรียงตามล่าสุด
        </Text>
      </View>

      {/* 3. Category Filter Chips (ทั้งหมด | ไอที | มือถือ | เกม | ข่าวไทย) */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Pressable
            onPress={() => setFilterGroupKey('all')}
            style={[
              styles.filterChip,
              {
                backgroundColor: filterGroupKey === 'all' ? colors.primary : colors.surfaceVariant,
                borderColor: filterGroupKey === 'all' ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: filterGroupKey === 'all' ? '#FFFFFF' : colors.muted, fontSize: 11 * scale },
              ]}
            >
              ทั้งหมด
            </Text>
          </Pressable>

          {feedGroups.map((group) => {
            const isSelected = filterGroupKey === group.key;
            return (
              <Pressable
                key={group.key}
                onPress={() => setFilterGroupKey(group.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? group.color : colors.surfaceVariant,
                    borderColor: isSelected ? group.color : colors.border,
                  },
                ]}
              >
                <View style={[styles.filterChipDot, { backgroundColor: isSelected ? '#FFFFFF' : group.color }]} />
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#FFFFFF' : colors.text, fontSize: 11 * scale },
                  ]}
                >
                  {group.label.replace('ข่าว', '')}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Japanese Style Channels Vertical List */}
      <ScrollView
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ paddingBottom: 20 }}
        style={styles.channelScrollView}
      >
        {filteredChannels.map((channel) => {
          const isSelected = channel.key === selectedFeedKey;
          const stat = channelStats[channel.key];
          const newCount = isSelected ? articles.filter(isArticleNew).length : (stat?.newCount ?? 0);
          const hasNew = newCount > 0;

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
                    ? withAlpha(channel.groupColor, 0.1)
                    : pressed
                    ? colors.surfaceVariant
                    : colors.surface,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              {/* Left Accent Color Stripe (Exactly like the Japanese app screenshot) */}
              <View
                style={[
                  styles.colorStripe,
                  {
                    backgroundColor: channel.groupColor,
                    width: isSelected ? 5 : 3.5,
                  },
                ]}
              />

              {/* Channel Name */}
              <View style={styles.channelNameWrap}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.channelName,
                    {
                      color: isSelected ? channel.groupColor : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                      fontSize: 14.5 * scale,
                    },
                  ]}
                >
                  {channel.type === 'aggregate'
                    ? filterGroupKey === 'all'
                      ? `⚡ ทั้งหมด · ${channel.groupLabel.replace('ข่าว', '')}`
                      : '⚡ รวมข่าวใหม่ทั้งหมด'
                    : channel.label}
                </Text>
                {hasNew && <View style={styles.channelNewDot} />}
              </View>

              {/* Right: Article count number or badge (e.g. 50, 60, or X ใหม่) */}
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
                        fontSize: 13 * scale,
                      },
                    ]}
                  >
                    {isSelected ? `${articles.length || 50}` : `${stat?.total ?? 50}`}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* 5. Minimal Bottom Action Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: colors.surfaceVariant,
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
          <MaterialCommunityIcons name="bookmark-outline" size={19} color={colors.primary} />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11.5 * scale }]}>
            บันทึก ({bookmarkCount})
          </Text>
        </Pressable>

        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />

        <Pressable
          hitSlop={8}
          onPress={() => navigateToTab('Search')}
          style={styles.bottomBarItem}
        >
          <MaterialCommunityIcons name="magnify" size={19} color={colors.primary} />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11.5 * scale }]}>
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
            size={19}
            color={isDark ? '#8DB9FF' : '#F59E0B'}
          />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11.5 * scale }]}>
            {isDark ? 'มืด' : 'สว่าง'}
          </Text>
        </Pressable>

        <View style={[styles.bottomDivider, { backgroundColor: colors.border }]} />

        <Pressable
          hitSlop={8}
          onPress={() => navigateToTab('Settings')}
          style={styles.bottomBarItem}
        >
          <MaterialCommunityIcons name="cog-outline" size={19} color={colors.muted} />
          <Text style={[styles.bottomBarText, { color: colors.text, fontSize: 11.5 * scale }]}>
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

function MainDrawer() {
  const { colors, scale } = useNews();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 18 * scale },
        drawerStyle: { backgroundColor: colors.surface, width: 295 },
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
        options={{ title: 'IT News App' }}
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
      <Stack.Screen name="Article" component={ArticleDetailScreen} options={{ title: 'รายละเอียดข่าว' }} />
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
  topBar: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 48,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  lastUpdateWrap: {
    flex: 1,
  },
  lastUpdateLabel: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBtn: {
    alignItems: 'center',
    borderRadius: 8,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  refreshBtn: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  subHeaderBar: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 38,
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  subHeaderTitle: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subHeaderSort: {
    fontWeight: '600',
  },
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  filterScroll: {
    gap: 6,
    paddingHorizontal: 10,
  },
  filterChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  filterChipDot: {
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  filterChipText: {
    fontWeight: '700',
  },
  channelScrollView: {
    flex: 1,
  },
  channelRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    height: 48,
    position: 'relative',
  },
  colorStripe: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
  },
  channelNameWrap: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    paddingLeft: 18,
    paddingRight: 8,
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
    paddingRight: 16,
  },
  channelCount: {
    letterSpacing: 0.3,
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
    letterSpacing: 0.3,
  },
  bottomBar: {
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  bottomBarItem: {
    alignItems: 'center',
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  bottomBarText: {
    fontWeight: '600',
  },
  bottomDivider: {
    height: 20,
    width: StyleSheet.hairlineWidth,
  },
});
