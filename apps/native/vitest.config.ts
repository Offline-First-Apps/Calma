import { defineConfig } from 'vitest/config';

/**
 * The app's tests are pure Node, and only pure Node.
 *
 * There is no jsdom, no React Native preset, no renderer. That is a limit
 * rather than a preference — but it is a limit worth naming, because the
 * temptation on seeing a test runner here is to start rendering components,
 * and a React Native component test needs a mock of every native module the
 * tree touches. Reanimated, MMKV, expo-font, svg. Those mocks then become the
 * thing under test.
 *
 * What runs here instead: assertions ABOUT the source. Rules that are
 * absolute rather than conditional — "no paywall can render during
 * onboarding" — are better proved by the absence of a mechanism than by a
 * render that tried a few paths. See
 * `src/features/onboarding/__tests__/guards.test.ts`.
 *
 * Everything with real logic in it lives in `packages/*` and is tested there,
 * against no simulator at all. If a test in here ever wants a component tree,
 * that is a sign the logic should have moved down a layer.
 *
 * `.ts` only, deliberately: a `.test.tsx` in this project is a mistake, and
 * excluding the extension is how it announces itself.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
