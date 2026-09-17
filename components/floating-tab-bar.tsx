import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { useThemeColors } from '../lib/theme';
import { TourTarget } from './tour-target';
import { Text } from './text';

/** Gap between the island and the safe area below it. */
const GAP = 12;
/** Inset from the left and right screen edges. */
const SIDE = 20;
/** The bar's resting height. It grows from here if system text is enlarged. */
const PILL_HEIGHT = 64;
/**
 * Tab labels stop growing past this multiple of their size. Without a cap, a
 * device set to the largest system text turns "Transactions" into two clipped
 * lines and pushes the icon out of the pill.
 */
const MAX_LABEL_SCALE = 1.2;
/** Space between the tab pill and the add button beside it. */
const SPLIT = 12;

/** Budgets has nothing to add from here, so the pill takes the full width. */
const ROUTES_WITH_ADD = ['index', 'transactions'];

/**
 * How far up from the bottom of the window the tab bar reaches, for anything
 * that needs to sit clear of it.
 */
export function useTabBarClearance(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + GAP + PILL_HEIGHT;
}

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const focusedRoute = state.routes[state.index]?.name;
  const showAdd = ROUTES_WITH_ADD.includes(focusedRoute);

  const add = () => {
    if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/add-transaction');
  };

  return (
    // Pinned over the screen rather than sitting in the navigator's column, so
    // it reserves no space and the content scrolls underneath it. Every layout
    // value is a plain style — an earlier version put the insets in utility
    // classes and the bar collapsed to nothing.
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        // Stretch rather than centre, so the add button always matches the
        // pill's real height even when enlarged text has made it taller.
        alignItems: 'stretch',
        gap: SPLIT,
        paddingHorizontal: SIDE,
        paddingBottom: insets.bottom + GAP,
      }}
    >
      {/* The pill and the add button are separate containers on one row, so the
          pill simply grows back to full width wherever add is not offered. */}
      <TourTarget id="tab-bar" style={{ flex: 1 }}>
      <View
        className="flex-row rounded-full bg-surface border border-border"
        style={{ minHeight: PILL_HEIGHT, padding: 6 }}
      >
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const color = focused ? colors.primary : colors.muted;
          const label =
            typeof options.tabBarLabel === 'string'
              ? options.tabBarLabel
              : (options.title ?? route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (focused || event.defaultPrevented) return;
            if (Platform.OS === 'ios') Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              className="active:opacity-60"
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                paddingVertical: 8,
                borderRadius: 999,
              }}
            >
              {options.tabBarIcon?.({ focused, color, size: 20 })}
              <Text
                numberOfLines={1}
                // Shrinks a touch rather than ellipsising, so "Transactions"
                // stays readable on a narrow phone instead of becoming "Trans…".
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                maxFontSizeMultiplier={MAX_LABEL_SCALE}
                style={{ fontSize: 11, color, fontWeight: focused ? '600' : '400' }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      </TourTarget>

      {/* aspectRatio on the wrapper keeps the button a circle at whatever height
          the stretched row settled on. Fixing its width instead, as this did
          before, turned it into an oval once enlarged text grew the pill. */}
      {showAdd && (
        <TourTarget id="tab-add" style={{ aspectRatio: 1, minHeight: PILL_HEIGHT }}>
          <Pressable
            onPress={add}
            accessibilityRole="button"
            accessibilityLabel="Add transaction"
            className="flex-1 items-center justify-center rounded-full bg-primary active:opacity-80"
          >
            <Ionicons name="add" size={28} color="white" />
          </Pressable>
        </TourTarget>
      )}
    </View>
  );
}
