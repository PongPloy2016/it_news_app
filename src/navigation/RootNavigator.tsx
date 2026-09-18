import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentComponentProps, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FEED_GROUPS } from '../config';
import { ArticleDetailScreen } from '../screens/ArticleDetailScreen';
import { BookmarksScreen } from '../screens/BookmarksScreen';
import { LatestScreen } from '../screens/LatestScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WebViewScreen } from '../screens/WebViewScreen';
import { useNews } from '../store/NewsContext';
import { MainTabParamList, RootStackParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const Drawer = createDrawerNavigator();

function DrawerContent(props: DrawerContentComponentProps) {
  const { colors, scale, setSelectedFeedKey } = useNews();

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
      <View style={[styles.drawerHeader, { backgroundColor: colors.surfaceVariant }]}> 
        <MaterialCommunityIcons name="newspaper-variant-outline" size={28} color={colors.primary} />
        <Text style={[styles.drawerTitle, { color: colors.text, fontSize: 22 * scale }]}>หมวดข่าว</Text>
      </View>

      <Text style={[styles.drawerSection, { color: colors.muted, fontSize: 12 * scale }]}>เลือกกลุ่มข่าว</Text>
      <View style={styles.groupList}>
        {FEED_GROUPS.map((group) => (
          <Pressable
            key={group.key}
            onPress={() => {
              const firstFeed = group.sources[0];
              if (firstFeed) {
                setSelectedFeedKey(firstFeed.key);
              }
              props.navigation.closeDrawer();
            }}
            style={[styles.groupButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.groupDot, { backgroundColor: group.color }]} />
            <Text style={[styles.groupLabel, { color: colors.text, fontSize: 14 * scale }]}>{group.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

function MainTabs() {
  const { colors, scale } = useNews();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 74,
          paddingBottom: 8,
          paddingTop: 8,
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
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="newspaper-variant-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'ค้นหา',
          tabBarLabel: 'ค้นหา',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="magnify" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Bookmarks"
        component={BookmarksScreen}
        options={{
          title: 'บันทึก',
          tabBarLabel: 'บันทึก',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bookmark-outline" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'ตั้งค่า',
          tabBarLabel: 'ตั้งค่า',
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog-outline" size={size} color={color} />,
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
        drawerStyle: { backgroundColor: colors.surface, width: 310 },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text,
        drawerLabelStyle: { fontWeight: '700', fontSize: 14 * scale },
        drawerItemStyle: { borderRadius: 12, marginHorizontal: 10, marginVertical: 2 },
        headerLeft: () => (
          <Pressable style={{ marginLeft: 16 }} onPress={() => navigation.openDrawer()}>
            <MaterialCommunityIcons name="menu" size={28} color={colors.text} />
          </Pressable>
        ),
      })}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} options={{ title: 'ข่าว' }} />
    </Drawer.Navigator>
  );
}

export function RootNavigator() {
  const { colors, scale } = useNews();
  return (
    <Stack.Navigator screenOptions={{
      headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: '800', fontSize: 18 * scale },
      contentStyle: { backgroundColor: colors.background },
    }}>
      <Stack.Screen name="MainTabs" component={MainDrawer} options={{ headerShown: false }} />
      <Stack.Screen name="Article" component={ArticleDetailScreen} options={{ title: 'รายละเอียดข่าว' }} />
      <Stack.Screen name="WebView" component={WebViewScreen} options={({ route }) => ({ title: route.params.title ?? 'เปิดข่าว' })} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContent: { paddingHorizontal: 12, paddingTop: 8 },
  drawerHeader: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', gap: 10, marginBottom: 16, padding: 16 },
  drawerTitle: { fontWeight: '800' },
  drawerSection: { fontWeight: '700', letterSpacing: 0.5, marginBottom: 8, marginLeft: 6, textTransform: 'uppercase' },
  groupList: { gap: 8 },
  groupButton: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 12 },
  groupDot: { borderRadius: 999, height: 10, width: 10 },
  groupLabel: { flex: 1, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
});
