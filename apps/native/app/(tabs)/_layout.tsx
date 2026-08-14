import { Ionicons } from '@expo/vector-icons';
import { Tabs, useSegments } from 'expo-router';
import { dark as darkTokens, light as lightTokens } from '@calma/tokens';
import { useThemeColor } from 'heroui-native';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUniwind } from 'uniwind';

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
const TAB_BAR_HEIGHT = 78;
/** The shelf's inset from each side, and how far it floats clear of the bottom. */
const SHELF_INSET = 16;
const SHELF_LIFT = 14;
const SHELF_RADIUS = 28;

export default function TabsLayout() {
  const { t } = useTranslation(['common', 'breathing', 'worry', 'journal', 'progress']);
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();

  // `mutedForeground` is not a heroui theme colour -- the name is `muted`.
  // The old value resolved to undefined, which React Navigation reads as
  // "use the default blue", so all four inactive tabs were tinted by a
  // library default rather than by the palette.
  const [activeTint, inactiveTint] = useThemeColor(['accent', 'muted']);

  /*
   * THE TAB BAR IS A FLOATING SHELF, NOT A BAR, AND IT WAS WRONG ON ALL FIVE
   * TABS FOR FIVE SESSIONS.
   *
   * Every design in the set that has a tab bar draws the same thing: 78px
   * tall, inset 16px from each side, floating 30px clear of the bottom, radius
   * 28, on `shelf` rather than `background`, with a drop shadow and a 1px
   * inset highlight along its top edge. What shipped was a full-width bar in
   * `background` with a hairline on top -- the platform default, wearing the
   * palette's colours.
   *
   * It is furniture, so it never got opened alongside a screen's design file,
   * and it is on every tab, so it was the most-seen wrong thing in the app.
   *
   * `position: absolute` is what lets it float: without it React Navigation
   * reserves the bar's height at the bottom of the screen and the shelf sits
   * in a sand-coloured gutter. Screens compensate through
   * `PANIC_FAB_CLEARANCE`, which already existed for the FAB.
   */
  // Straight from the token module, not `useThemeColor`: heroui's hook only
  // knows heroui's own names, and every Calma-only colour is invisible to it.
  const { theme } = useUniwind();
  const tokens = theme === 'dark' ? darkTokens : lightTokens;

  /*
   * THREE SHELVES, NOT ONE.
   *
   * The shelf is mixed against the ground it stands on, the same way
   * `surfaceQuiet`, `surfaceImmersive` and `surfaceWorryQuiet` are — so the
   * Worries tab and the Write tab each carry their own pair. Session 16
   * shipped a single shelf and `chrome.test.ts` caught it on its first run.
   *
   * `useSegments` rather than a per-screen option, because `tabBarStyle` is
   * set once on the navigator: reading the active route here is what lets one
   * declaration follow the ground underneath it.
   */
  const segments = useSegments();
  const activeTab = segments[segments.length - 1];

  const { shelf, shelfBorder } =
    activeTab === 'worries'
      ? { shelf: tokens.shelfWorry, shelfBorder: tokens.shelfWorryBorder }
      : activeTab === 'write'
        ? { shelf: tokens.shelfWrite, shelfBorder: tokens.shelfWriteBorder }
        : { shelf: tokens.shelf, shelfBorder: tokens.shelfBorder };

  const shelfHighlight = tokens.shelfHighlight;

  return (
    <View className="flex-1">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: activeTint,
          tabBarInactiveTintColor: inactiveTint,
          tabBarStyle: {
            position: 'absolute',
            left: SHELF_INSET,
            right: SHELF_INSET,
            bottom: Math.max(insets.bottom, SHELF_INSET) + SHELF_LIFT,
            height: TAB_BAR_HEIGHT,
            backgroundColor: shelf,
            borderRadius: SHELF_RADIUS,
            // React Navigation draws a 1px top hairline by default. The shelf
            // has a full border instead, so the hairline has to be removed
            // rather than recoloured or it doubles up along the top edge.
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: shelfBorder,
            paddingBottom: 0,
            paddingTop: 0,
            elevation: 12,
            shadowColor: '#2A3642',
            shadowOpacity: 0.28,
            shadowRadius: 30,
            shadowOffset: { width: 0, height: 12 },
          },
          tabBarItemStyle: { paddingTop: 10, paddingBottom: 10 },
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

      {/* The shelf's inset highlight. React Native has no `inset` shadow, so
          the design's `inset 0 1px 0` is drawn as a hairline pinned just
          inside the top edge. `pointerEvents="none"` keeps it off the tabs. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: SHELF_INSET + SHELF_RADIUS / 2,
          right: SHELF_INSET + SHELF_RADIUS / 2,
          bottom:
            Math.max(insets.bottom, SHELF_INSET) + SHELF_LIFT + TAB_BAR_HEIGHT - 2,
          height: 1,
          backgroundColor: shelfHighlight,
        }}
      />

      <PanicFab
        reduceMotion={reduceMotion}
        bottomOffset={TAB_BAR_HEIGHT + SHELF_LIFT}
      />
    </View>
  );
}
