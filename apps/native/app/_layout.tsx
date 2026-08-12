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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from 'heroui-native';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { AppThemeProvider } from '@/contexts/app-theme-context';
import { BootError } from '@/src/components/BootError';
import { boot, type BootResult } from '@/src/lib/boot';
import { transitionFor, useReduceMotion } from '@/src/lib/motion';
import { StorageProvider } from '@/src/lib/repositories';
import { useAppStateEffects } from '@/src/lib/appState';

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

  const onLayout = useCallback(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

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
                <Routes firstRun={result.firstRun} />
              )}
            </StorageProvider>
          </HeroUINativeProvider>
        </AppThemeProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

function Routes({ firstRun }: { firstRun: boolean }) {
  const reduceMotion = useReduceMotion();
  const transition = transitionFor(reduceMotion);

  useAppStateEffects();

  return (
    <Stack
      screenOptions={{ headerShown: false, ...transition }}
      initialRouteName={firstRun ? 'onboarding' : '(tabs)'}
    >
      <Stack.Screen name="(tabs)" />

      {/* Full-screen, no tab bar, no panic FAB. */}
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="panic" options={{ animation: 'fade' }} />
      <Stack.Screen name="session/[pattern]" options={{ animation: 'fade' }} />
      <Stack.Screen name="worry-window" />
      {/* The editor is full-screen: writing a thought record should not have
          a tab bar under it offering somewhere else to be. */}
      <Stack.Screen name="journal/[id]" />

      {/* The one sheet. A paywall is not a place you arrive at. */}
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.55],
          sheetCornerRadius: 28,
          sheetGrabberVisible: true,
        }}
      />
    </Stack>
  );
}
