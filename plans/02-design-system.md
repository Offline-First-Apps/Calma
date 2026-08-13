# 02 — Design System

Tokens, fonts, theming, and the shared component primitives.

**Branch:** `feat/design-system`
**Depends on:** 01
**Reference:** `systems/03-design-system.md`

---

## T01 — Populate colour, spacing, radius, and shadow tokens

- [ ]
- **Commit:** `feat(tokens): add calma colour, spacing, radius and shadow scales`
- **Touches:** `packages/tokens/src/{colors,spacing,radius,shadow}.ts`
- **Done when:** every value from `systems/03-design-system.md` is exported as a typed const, light and dark semantic maps are defined (`bg`, `surface`, `border`, `text`, `textMuted`, `accent`), and no pure white or pure black appears anywhere.

---

## T02 — Add typography tokens and bundle Figtree

- [ ]
- **Commit:** `feat(theme): add typography scale and bundle figtree`
- **Touches:** `packages/tokens/src/typography.ts`, `apps/native/src/theme/fonts.ts`, `apps/native/package.json`
- **Done when:** `@expo-google-fonts/figtree` is installed with weights 400/500/600/700, the seven text styles are defined, fonts load from the bundle with no network request, and a font-loading failure still renders readable fallback text.

---

## T03 — Wire tokens into uniwind

- [ ]
- **Commit:** `feat(theme): wire design tokens into uniwind config`
- **Touches:** `apps/native/tailwind.config.js`, `apps/native/src/theme/index.ts`
- **Depends on:** T01, T02
- **Done when:** `bg-sand-100`, `text-navy-900`, `rounded-lg`, and the `body`/`title` text styles all resolve in a native component, and `check-types` passes.

---

## T04 — Add theme provider with dark mode

- [ ]
- **Commit:** `feat(theme): add theme provider with system, light and dark modes`
- **Touches:** `apps/native/src/theme/ThemeProvider.tsx`, `apps/native/src/theme/useTheme.ts`
- **Depends on:** T03
- **Done when:** the app follows the system scheme by default, an override can be set, switching does not remount the tree, and the status bar style updates to match.

---

## T05 — Build core primitives: Screen, Card, Text

- [ ]
- **Commit:** `feat(ui): add screen, card and text primitives`
- **Touches:** `apps/native/src/components/{Screen,Card,Text}.tsx`
- **Depends on:** T04
- **Done when:** `Screen` handles safe area, background, and keyboard avoidance; `Text` takes a `variant` prop from the type scale; both render correctly in light and dark.

---

## T06 — Build button primitives: PrimaryButton, QuietButton

- [ ]
- **Commit:** `feat(ui): add primary and quiet button primitives`
- **Touches:** `apps/native/src/components/{PrimaryButton,QuietButton}.tsx`
- **Depends on:** T05
- **Done when:** minimum height 52, press scale 0.97 over 120ms, `accessibilityRole="button"`, disabled state uses opacity not colour change, and `QuietButton` is visually equal in weight and never delayed relative to `PrimaryButton`.

---

## T07 — Add reduce-motion support

- [ ]
- **Commit:** `feat(theme): respect reduce motion system setting`
- **Touches:** `apps/native/src/theme/useReduceMotion.ts`, motion constants
- **Depends on:** T04
- **Done when:** `useReduceMotion()` reflects `AccessibilityInfo` and updates live on change, and a shared `motion` module exposes durations that collapse to cross-fades when it's on.

---

## T08 — Make every numeral scale with the system font

- [ ]
- **Commit:** `fix(theme): make numerals scale with system font setting`
- **Depends on:** T05
- **Touches:** `apps/native/src/components/Text.tsx`, `packages/tokens/src/typography.ts`
- **Done when:** every numeral in the app renders through the scaling `Text` primitive — SUDS values and scale labels, streak digits, pending counts, countdowns, journal intensity values and deltas, timestamps, and chart axis labels. No number is hard-coded as ornamental display type. Supporting a font scale everywhere *except* the numbers is worse than not supporting it, because the person knows the app can do it and didn't (`plans/19-review-findings.md` R2).

---

## T09 — Verify type scaling and contrast across both platforms

- [ ]
- **Commit:** `test(theme): verify dynamic type scaling and contrast ratios`
- **Touches:** `apps/native/src/theme/contrast.test.ts`, plan notes
- **Depends on:** T05, T06
- **Done when:** a test asserts every text-on-background token pair meets 4.5:1 (or 3:1 for large), and all primitives have been screenshot-checked at 200% font scale on iOS and Android with no truncation or overlap.
