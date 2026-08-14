import '@/global.css';

import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
} from '@expo-google-fonts/figtree';
import {
  Newsreader_400Regular,
  Newsreader_400Regular_Italic,
  Newsreader_500Medium,
} from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AppThemeProvider } from '@/contexts/app-theme-context';
import { BootError } from '@/src/components/BootError';
import { useEntitlementStore } from '@/src/features/entitlement/store';
import { useThemePreference } from '@/src/features/settings/useThemePreference';
import { useAppStateEffects } from '@/src/lib/appState';
import { useReschedule } from '@/src/lib/notifications/useReschedule';
import { boot, type BootResult } from '@/src/lib/boot';
import { transitionFor, useReduceMotion } from '@/src/lib/motion';
import { StorageProvider, useStorage } from '@/src/lib/repositories';

/**
 * The boot gate.
 *
 * The splash screen stays up through fonts, storage, migrations and hydration,
 * and comes down once. Nothing here waits on the network.
 *
 * The font gate matters more than it looks: the two typefaces *are* the design
 * (D-017), and a flash of system serif on the welcome screen is the first
 * impression of an app whose entire pitch is that it feels different.
 */
void SplashScreen.preventAutoHideAsync();

/**
 * The anchor for back behaviour, and NOT the first-run decision.
 *
 * expo-router builds this navigator's screens from the filesystem, and
 * `unstable_settings.initialRouteName` is what it honours. It is set to
 * `(tabs)` so that arriving on a deep link has somewhere to go back to.
 *
 * WHICH SCREEN A FIRST LAUNCH LANDS ON IS DECIDED BELOW, NOT HERE. See the
 * long note in `Routes`.
 */
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader: Newsreader_400Regular,
    Newsreader_500Medium,
    /**
     * The italic is a REGISTERED FACE, not `fontStyle: 'italic'`.
     *
     * Same trap as the weights: neither platform synthesises an oblique for a
     * custom family, so asking for italic on `Newsreader` returns the upright
     * face on iOS and can fall back to a system serif on Android — silently.
     * f8's "How does that feel?" is the only italic in the app, and it is the
     * closing line of the worry window, so it is worth one more face.
     */
    Newsreader_400Regular_Italic,
    Figtree: Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
  });

  const [result, setResult] = useState<BootResult | null>(null);
  const [dismissedDegraded, setDismissedDegraded] = useState(false);

  useEffect(() => {
    let alive = true;
    boot().then((booted) => {
      if (alive) setResult(booted);
    });
    return () => {
      alive = false;
    };
  }, []);

  const ready = fontsLoaded && result !== null;

  /**
   * Set once the first-run redirect has been issued (or was not needed).
   *
   * The splash stays up until this is true, so a first launch never shows a
   * frame of the Home tab before onboarding replaces it. Someone opening this
   * app for the first time should see the welcome screen, not a flash of a
   * product they have not been introduced to.
   */
  const [routed, setRouted] = useState(false);

  const onLayout = useCallback(() => {
    if (ready && routed) void SplashScreen.hideAsync();
  }, [ready, routed]);

  // The layout callback only fires on layout changes, and `routed` flips a
  // tick later than the last one. Hiding here too covers that gap.
  useEffect(() => {
    if (ready && routed) void SplashScreen.hideAsync();
  }, [ready, routed]);

  if (!ready) return null;

  const showDegraded = result.degraded !== null && !dismissedDegraded;

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
      <KeyboardProvider>
        <AppThemeProvider>
          <HeroUINativeProvider>
            <StorageProvider
              value={{
                repositories: result.repositories,
                stores: result.stores,
                readOnly: result.degraded !== null,
              }}
            >
              {showDegraded ? (
                <BootError onContinue={() => setDismissedDegraded(true)} />
              ) : (
                <Routes
                  firstRun={result.firstRun}
                  onRouted={() => setRouted(true)}
                />
              )}
            </StorageProvider>
          </HeroUINativeProvider>
        </AppThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

/**
 * THE FIRST-RUN REDIRECT, AND THE BUG IT REPLACES.
 *
 * This used to be `initialRouteName={firstRun ? 'onboarding' : '(tabs)'}` as a
 * prop on `<Stack>`. That prop does not decide anything here. expo-router
 * derives a layout's screens from the filesystem and takes the initial route
 * from `unstable_settings`, which is hard-coded to `(tabs)` — so the ternary
 * read as if it worked, type-checked, and would have sent every first launch
 * straight to Home.
 *
 * The effect of that is worth stating plainly, because it is why this is not
 * a cosmetic fix: ten onboarding screens, an entire plan's worth of work,
 * would have been unreachable code behind a flag that never fired. Nobody
 * would have seen a welcome screen, and nothing would have errored.
 *
 * It is replaced with an imperative `replace` — the same mechanism
 * `OnboardingFlow` already uses to leave — issued once, before the splash
 * comes down. `replace` rather than `push` so there is no Home underneath to
 * go back to: onboarding is where the app starts, not somewhere it navigated.
 *
 * `onRouted` is what lets the splash wait. Without it a first launch paints
 * one frame of the Home tab before this runs, which is a glimpse of a product
 * someone has not been introduced to yet.
 *
 * NOT VERIFIED ON A DEVICE. Written in a sandbox that cannot run the app.
 * This is the first thing to check when it boots: clear prefs, launch, and
 * confirm you land on "Welcome" with no flash of the tab bar.
 */
function Routes({
  firstRun,
  onRouted,
}: {
  firstRun: boolean;
  onRouted: () => void;
}) {
  const router = useRouter();
  const reduceMotion = useReduceMotion();
  const transition = transitionFor(reduceMotion);

  useAppStateEffects();
  useEntitlement();
  // Applies `prefs.theme` to Uniwind on every change, including the one
  // hydration makes at boot. Mounted here rather than in the picker: a
  // preference applied by the screen that sets it is correct exactly once and
  // reverts on the next launch.
  useThemePreference();
  // Rebuilds the whole notification schedule whenever anything it depends on
  // changes — window time, duration, tier, pending count, permission, boot.
  // Mounted here so that list is one dependency array rather than seven call
  // sites, one of which would eventually be forgotten.
  useReschedule();

  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    if (firstRun) router.replace('/onboarding');

    // Reported whether or not a redirect happened — this is "routing has been
    // decided", not "a navigation occurred", and the splash waits on the
    // decision.
    onRouted();
  }, [firstRun, onRouted, router]);

  return (
    <Stack screenOptions={{ headerShown: false, ...transition }}>
      <Stack.Screen name="(tabs)" />

      {/* Full-screen, no tab bar, no panic FAB. */}
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="panic" options={{ animation: 'fade' }} />
      <Stack.Screen name="session/[pattern]" options={{ animation: 'fade' }} />
      <Stack.Screen name="worry-window" />
      {/* The editor is full-screen: writing a thought record should not have
          a tab bar under it offering somewhere else to be. */}
      <Stack.Screen name="journal/[id]" />

      <Stack.Screen name="journal/drafts" />
      <Stack.Screen name="journal/search" />
      {/* Set outside a session, never during one -- see CustomRatio.tsx. */}
      <Stack.Screen name="custom-rhythm" />

      {/*
        The one sheet. A paywall is not a place you arrive at.

        The detent was 0.55 while `paywall.tsx` was a title and two buttons.
        i1 is a full screen -- reassurance, three features, three prices and
        two ways out -- so it needs the height. It stays a sheet rather than
        becoming a route because what is underneath must remain visible:
        someone reads a price with the thing they were doing still behind it,
        and "Not now" puts them straight back into it.
      */}
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.92],
          sheetCornerRadius: 28,
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}

/**
 * Hydrates the entitlement and refreshes it on foreground (plan 11 T02).
 *
 * Deliberately NOT part of `boot()`. Boot decides whether the app can open at
 * all; a billing SDK has no business in that chain, and someone opening this
 * at 3am is not waiting on a network call to RevenueCat. Everything here
 * fails toward "free tier, paywalls suppressed", which is a state the app
 * works perfectly well in -- every relief tool is free.
 *
 * The refresh is throttled to once an hour inside the store, so calling it on
 * every foreground is not the same as polling.
 */
function useEntitlement(): void {
  const { stores } = useStorage();
  const hydrate = useEntitlementStore((state) => state.hydrate);
  const refresh = useEntitlementStore((state) => state.refresh);

  useEffect(() => {
    hydrate(stores.cache);
    void refresh(stores.cache);

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refresh(stores.cache);
    });

    return () => subscription.remove();
  }, [hydrate, refresh, stores.cache]);
}
