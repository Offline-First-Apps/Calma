# Design System — Current State

**Source of truth is `designs/extracted/`** — 58 screens × 2 themes, decoded from
the delivered bundles. Not `systems/03-design-system.md`, which was written
*before* the designs and has been superseded on colour and type.

**The rule:** the designer wins on colour and type. The system docs win on
behaviour — "no red", "amber drops in dark mode", "nothing on the panic path"
are load-bearing and survive any visual decision.

---

## Built

`packages/tokens` — shared by native and web. Every value extracted from the
delivered screens, not invented.

| File | Contains |
|---|---|
| `colors.ts` | Light + dark scales, amber, clay, orb gradient stops |
| `typography.ts` | The two-typeface split, 11-step type scale |
| `layout.ts` | Spacing, radii, control heights, elevation, hairlines |
| `motion.ts` | Durations, easings, the ambient orb loop, reduced-motion set |
| `tailwind.ts` | Preset consumed by uniwind (native) and Tailwind (web) |

Supporting reference: `designs/TOKEN-CENSUS.md` (every value and its frequency),
`designs/extract.py` (regenerates `extracted/` if bundles change).

---

## The two typefaces — the most important thing on this page

| | Used for | Examples |
|---|---|---|
| **Newsreader** (serif) | Sentences a person is meant to **feel** | "Breathe into it." · "Then this one isn't yours to carry." · "You're still here. That's enough." |
| **Figtree** (sans) | Everything they only need to **read** | Buttons, labels, hints, settings, counts, timestamps |

Getting this backwards is the fastest way to make the app feel wrong. A serif
"Save" button reads precious; a sans "Breathe into it." reads like a system
notification.

IBM Plex Mono appears in the design files as annotation. **It must not ship.**

---

## Palette, in one paragraph

Light ground is `#FBF7F1`, a warm off-white. Dark ground is `#141C26`, deepening
to `#101823` for full-screen breathing. Text is `#2A3642` on light. Dark mode
carries **two** text colours on purpose: `#EAE2D7` warm cream for serif emotional
copy, `#C9D2DA` cool grey for functional sans copy — using the cool grey on an
emotional line makes it read clinical. Amber is `#E39A45` in light and drops to
`#D19249` in dark, which is the 2am rule encoded as a token. Clay `#BE7458`
carries worry surfaces and the crisis exit. There is no red anywhere.

---

## Signature dimensions

Pulled straight from the designs — matching these makes new screens feel native
to the set.

- **46px** — the most repeated dimension in the entire design system. Chips,
  pills, the crisis exit, language rows, small selectable options.
- **62px** — primary and secondary buttons, radius 31 (always half the height).
- **64 / 78px** — option cards, plain and with a description line.
- **`padding: 76px 32px 40px`** — standard screen content inset.
- **300px** — the orb, on onboarding and session screens.
- **11s** — the ambient breath cycle, peaking at 46% rather than 50% so the
  inhale is marginally shorter than the exhale, as a settled breath actually is.

---

## The orb — three stacked layers

Not a circle with a gradient. Three absolutely-positioned radial layers inside a
300×300 box, each blurred:

1. **Glow** — `inset: -56px`, `rgba(227,154,69,0.38)` → transparent at 68%,
   `blur(34px)`, animating opacity 0.72 → 1.
2. **Body** — `inset: 22px`, `#F8DFB2` 0% → `#EFB86E` 40% → `#E39A45` 66% →
   transparent 84%, `blur(17px)`.
3. **Highlight** — `inset: 84px`, offset to 46%/36%, near-white
   `rgba(255,248,235,0.92)` → transparent, `blur(22px)`.

The offset highlight and the heavy blur are what make it read as *alive* rather
than as a div. In React Native this is `react-native-svg` radial gradients plus
Reanimated on the UI thread — never a JS-driven animation.

---

## Components — built

**Native.** We theme heroui-native rather than forking it. Every one of its
components (button, card, chip, input, sheet, switch, slider, tabs…) reads CSS
variables, so `apps/native/src/theme/calma.css` re-skins the whole library at
once. Note that `--danger` is remapped to **clay, not red** — an accidental
`variant="danger"` degrades to something warm rather than alarming.

`apps/native/src/ui/` adds what heroui-native doesn't have:

| Component | Notes |
|---|---|
| `Text` | The two-typeface split. Most important component in the app. |
| `Button` | 62px, pill. `quiet` is equal in weight to `primary`, never greyed. |
| `Card` | default / paper / raised / worry |
| `OptionCard` | Multi-select. Min 64px but grows with text — never truncates. |
| `Chip` | 46px pill, the most repeated dimension in the design set. |
| `Orb` | Three blurred radial layers. UI-thread only. |
| `CrisisExit` | "I need this now". Clay, not red. On every onboarding step. |
| `ProgressHairline` | Onboarding only. Deliberate exception to the no-progress rule. |
| `Screen` | Safe area + the 76/32/40 content inset. |

**Web.** `packages/ui/src/styles/globals.css` carries the Calma palette as
shadcn theme variables, so every shadcn component inherits it. `button.tsx`
variants are reshaped: pill by default, 46px standard / 62px large, `quiet`
added, `destructive` remapped to clay.

---

## Not built yet

- **Fonts.** Newsreader and Figtree need bundling via `@expo-google-fonts`.
  Both are Google Fonts; no licensing issue. **Nothing renders correctly until
  this is done.**
- **Wiring.** `packages/tokens` and `calma.css` are not yet imported by
  `apps/native`; `apps/web` still needs the font links.
- Screens. All of them.
