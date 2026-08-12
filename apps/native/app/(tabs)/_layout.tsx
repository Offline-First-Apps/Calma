import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useThemeColor } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PanicFab } from '@/src/components/PanicFab';
import { useReduceMotion } from '@/src/lib/motion';

/**
 * Five tabs, and the panic button over the top of all of them.
 *
 * Write is a tab rather than an offer that appears after a bad breathing
 * session (D-015). Reaching journaling only through "that didn't work" made it
 * structurally the consolation prize; for some people it is the main tool.
 *
 * The FAB is a sibling of the navigator, not a child of any screen, so it
 * survives tab switches without remounting — and its ambient pulse never
 * restarts, which would be visible.
 */
const TAB_BAR_HEIGHT = 56;

export default function TabsLayout() {
  const { t } = useTranslation(['common', 'breathing', 'worry', 'journal', 'progress']);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  // `mutedForeground` is not a heroui theme colour -- the name is `muted`.
  // The old value resolved to undefined, which React Navigation reads as
  // "use the default blue", so all four inactive tabs were tinted by a
  // library default rather than by the palette.
  const [active, inactive, background, border] = useThemeColor([
    'accent',
    'muted',
    'background',
    'border',
  ]);

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: active,
          tabBarInactiveTintColor: inactive,
          tabBarStyle: {
            backgroundColor: background,
            borderTopColor: border,
            height: TAB_BAR_HEIGHT + insets.bottom,
            paddingBottom: insets.bottom,
          },
          tabBarLabelStyle: {
            // The registered face, not a family + weight pair. expo-font does
            // not synthesise weights, so 'Figtree' at '500' silently renders
            // as regular on iOS and can fall back to Roboto on Android.
            fontFamily: 'Figtree_500Medium',
            fontSize: 11,
          },
          // Labels are single words on purpose. Five of them have to fit at
          // 200% font scale, and the rule is that the label gets shorter
          // before the scaling gets capped.
          tabBarAllowFontScaling: true,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('common:tabs.home'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="breathe"
          options={{
            title: t('common:tabs.breathe'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ellipse-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="write"
          options={{
            title: t('common:tabs.write'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="create-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="worries"
          options={{
            title: t('common:tabs.worries'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cloud-outline" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: t('common:tabs.progress'),
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="leaf-outline" color={color} size={size} />
            ),
          }}
        />
      </Tabs>

      <PanicFab reduceMotion={reduceMotion} bottomOffset={TAB_BAR_HEIGHT} />
    </View>
  );
}
