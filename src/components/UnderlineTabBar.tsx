import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { useNews } from '../store/NewsContext';

export interface UnderlineTabItem<T extends string = string> {
  key: T;
  label: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
  badge?: number | string;
  badgeColor?: string;
}

interface UnderlineTabBarProps<T extends string = string> {
  tabs: UnderlineTabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  indicatorColor?: string;
  style?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}

export function UnderlineTabBar<T extends string = string>({
  tabs,
  activeKey,
  onChange,
  indicatorColor,
  style,
  scrollable = false,
}: UnderlineTabBarProps<T>) {
  const { colors, scale, isDark } = useNews();
  const [layouts, setLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const indicatorLeft = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;

  const activeTab = tabs.find((t) => t.key === activeKey);

  const handleTabLayout = (key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setLayouts((prev) => {
      if (prev[key]?.x === x && prev[key]?.width === width) return prev;
      return { ...prev, [key]: { x, width } };
    });
  };

  useEffect(() => {
    const activeLayout = layouts[activeKey];
    if (activeLayout) {
      if (!isInitialized) {
        indicatorLeft.setValue(activeLayout.x);
        indicatorWidth.setValue(activeLayout.width);
        setIsInitialized(true);
      } else {
        Animated.parallel([
          Animated.spring(indicatorLeft, {
            toValue: activeLayout.x,
            useNativeDriver: false,
            friction: 7,
            tension: 85,
          }),
          Animated.spring(indicatorWidth, {
            toValue: activeLayout.width,
            useNativeDriver: false,
            friction: 7,
            tension: 85,
          }),
        ]).start();

        if (scrollable) {
          scrollViewRef.current?.scrollTo({
            x: Math.max(0, activeLayout.x - 36),
            animated: true,
          });
        }
      }
    }
  }, [activeKey, layouts, isInitialized, scrollable]);

  const activeIndicatorColor =
    indicatorColor || activeTab?.color || (isDark ? '#FFFFFF' : '#111827');

  const content = (
    <View style={styles.tabsRow}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        const hasBadge =
          tab.badge !== undefined &&
          (typeof tab.badge === 'number' ? tab.badge > 0 : Boolean(tab.badge));

        const tabActiveBg = tab.color || (isDark ? '#FFFFFF' : '#111827');
        const tabActiveText = tab.color ? '#FFFFFF' : isDark ? '#111827' : '#FFFFFF';

        return (
          <View
            key={tab.key}
            onLayout={(e) => handleTabLayout(tab.key, e)}
            style={styles.tabItemWrap}
          >
            <Pressable
              onPress={() => onChange(tab.key)}
              style={({ pressed }) => [
                styles.tabPill,
                {
                  backgroundColor: isActive
                    ? tabActiveBg
                    : pressed
                    ? colors.surfaceVariant
                    : isDark
                    ? '#27272A'
                    : '#F1F3F5',
                },
              ]}
              hitSlop={6}
            >
              {tab.iconName && (
                <MaterialCommunityIcons
                  name={tab.iconName}
                  size={15 * scale}
                  color={
                    isActive
                      ? tabActiveText
                      : tab.color || colors.muted
                  }
                  style={styles.tabIconLeft}
                />
              )}

              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? tabActiveText : colors.text,
                    fontSize: 12.5 * scale,
                    fontWeight: isActive ? '800' : '600',
                  },
                ]}
              >
                {tab.label}
              </Text>

              {hasBadge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        tab.badgeColor ||
                        (isActive
                          ? isDark
                            ? 'rgba(0,0,0,0.3)'
                            : 'rgba(255,255,255,0.3)'
                          : '#EF4444'),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: '#FFFFFF',
                        fontSize: 10 * scale,
                      },
                    ]}
                  >
                    {tab.badge}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>
        );
      })}

      {/* Animated Underline Indicator Bar */}
      {isInitialized && (
        <Animated.View
          style={[
            styles.underlineBar,
            {
              left: indicatorLeft,
              width: indicatorWidth,
              backgroundColor: activeIndicatorColor,
            },
          ]}
        />
      )}
    </View>
  );

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }, style]}>
      {scrollable ? (
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 4,
    marginBottom: 8,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingBottom: 7,
    gap: 8,
  },
  tabItemWrap: {
    alignItems: 'center',
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 7,
    borderRadius: 999,
  },
  tabLabel: {
    letterSpacing: -0.1,
  },
  tabIconLeft: {
    marginRight: 6,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 6,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  underlineBar: {
    position: 'absolute',
    bottom: 0,
    height: 3.5,
    borderRadius: 2,
  },
});
