# Design System

Warm neutrals. Nothing clinical white, nothing neon. The interface should feel like a lamp-lit room, not a clinic.

> ## THE DESIGN FILES OUTRANK THIS DOCUMENT
>
> `designs/extracted/*.html` is the source of truth for what a screen looks
> like: layout, colour, size, spacing, weight. **This document explains why,
> and states the rules that survive a visual revision.** Where the two
> disagree about an appearance, the design file wins.
>
> This is not theoretical. It has been settled three times, and this document
> lost each one:
>
> - The SUDS slider shows **no number**, though this doc allows the current
>   value. D2: "the value is a position, not a score."
> - Light mode **has** its own immersive background, `#F2E7D6`, though the
>   tokens claimed it did not.
> - Amber fills are **three-stop gradients with a coloured glow**, not the
>   flat `amber.400` implied here.
>
> The single exception, decided deliberately: **the orb's proportions follow
> this document (35% halo at 1.35R), not d3's 1.64.** See
> `plans/06-breathing-engine.md` T02.
>
> **Before building any screen, open its design file and read the caption.**
> The markup tells you what it looks like; the caption tells you why. Run
> `python designs/extract.py` if `designs/extracted/` is missing.


Tokens live in `packages/tokens` and are consumed by uniwind (native) and Tailwind (web).

---

## Colour

### Sand — backgrounds and surfaces

| Token | Hex | Use |
|---|---|---|
| `sand.50` | `#FDFBF7` | highest surface, sheets |
| `sand.100` | `#F7F1E8` | **app background (light)** |
| `sand.200` | `#EFE6DA` | raised cards |
| `sand.300` | `#E2D5C5` | borders, dividers |
| `sand.400` | `#CDBBA6` | disabled fills |

### Amber — primary warm accent, the orb, breathing

| Token | Hex | Use |
|---|---|---|
| `amber.200` | `#F7DCB8` | orb outer glow |
| `amber.300` | `#F0C48A` | orb mid |
| `amber.400` | `#E5A961` | **primary action fill**, orb core |
| `amber.500` | `#D48F42` | pressed state |
| `amber.600` | `#B0722F` | text on sand (AA at 16px+) |

### Clay — secondary, the worry surfaces

| Token | Hex | Use |
|---|---|---|
| `clay.300` | `#D5A894` | worry card tint |
| `clay.400` | `#BE8873` | worry accents, release animation |
| `clay.500` | `#9E6A56` | clay text on sand |

### Navy — text, focus, night

| Token | Hex | Use |
|---|---|---|
| `navy.900` | `#161E29` | **app background (dark)** |
| `navy.800` | `#1E2938` | dark raised card |
| `navy.700` | `#2E3B4E` | dark border |
| `navy.500` | `#4A5B72` | secondary text (dark mode) |
| `navy.300` | `#8494A8` | muted text (light mode) |
| `navy.100` | `#D8E0EA` | primary text (dark mode) |

### Sage — quiet affirmative

| Token | Hex | Use |
|---|---|---|
| `sage.400` | `#7D9A7E` | streak, completed, "within your control" |

**Prohibited.** Pure `#FFFFFF`, pure `#000000`, any saturated red, any traffic-light semantic pair. There is no error red in this app — problems are stated in navy text with a clay accent. A red alert to an anxious person is a small act of harm.

---

## Dark mode

Not optional. The blueprint's own framing is *"the panic that hits at 2am"* — dark mode is the primary use case, not a preference.

- Background `navy.900`, cards `navy.800`, text `navy.100`.
- Amber stays the accent but drops to `amber.300` for glow so it doesn't sear dark-adapted eyes.
- **Maximum screen brightness is never forced.** Some apps do this for "focus"; we don't.
- Follows system by default, overridable in Settings.

---

## Typography

**Figtree** (D-010), bundled via `@expo-google-fonts/figtree`. Weights 400, 500, 600, 700.

| Style | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 34 / 42 | 600 | onboarding, session completion |
| `title` | 26 / 34 | 600 | screen titles |
| `heading` | 20 / 28 | 600 | section headers |
| `body` | 17 / 26 | 400 | **default** |
| `bodyEmphasis` | 17 / 26 | 500 | inline emphasis |
| `callout` | 15 / 22 | 400 | supporting text |
| `caption` | 13 / 18 | 500 | labels, timestamps |

**Rules.**
- Line height is generous everywhere. Tight text reads as urgent.
- Letter-spacing `+0.2` on `caption`, `0` elsewhere. No dramatic tracking.
- **Never all-caps.** It reads as shouting.
- **Never italic** for emphasis; use `bodyEmphasis`.
- Minimum body size 17. This is not a dense-data app.
- Dynamic Type / font scaling honoured up to 200%. Every screen tested at 200% — layouts wrap, never truncate. `numberOfLines` is prohibited on user content.

---

## Spacing & shape

4pt base: `1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64`.

- Screen horizontal padding: `5` (20).
- Vertical rhythm between sections: `8` (32).
- Radii: `sm 12`, `md 16`, `lg 24`, `xl 32`, `full 9999`. Nothing sharper than 12 — no hard corners anywhere.
- Shadows: very soft, large, low opacity. `shadow.card = { y: 2, blur: 16, color: navy.900 @ 6% }`. No hard drop shadows.

### Touch targets

Minimum 48×48. The panic FAB is **72×72** — it must be hittable by someone whose hands are shaking.

---

## Motion

`react-native-reanimated` v4. Everything on the UI thread.

| Motion | Duration | Curve |
|---|---|---|
| Screen transition | 280ms | `easeOutCubic` |
| Card / sheet | 320ms | spring, damping 18, stiffness 140 |
| Button press | 120ms | `easeOut`, scale 0.97 |
| Worry dissolve | 900ms | opacity + blur + slight rise |
| Worry release | 1400ms | scatter + drift up, ease-out |
| Orb breathing | pattern-driven | `easeInOutSine` |

**Rules.**
- No bounce, no overshoot, no elastic. Nothing should feel bouncy or playful.
- Nothing flashes, strobes, or pulses faster than 1Hz outside the orb.
- **Reduce Motion** (`AccessibilityInfo.isReduceMotionEnabled`) is respected globally: orb switches from scale animation to a gentle opacity/colour shift, dissolves become simple fades, transitions become cross-fades. Breathing timing is unchanged — the guidance still works.

---

## The orb

A warm gradient circle with soft blurred edges that pulses with the breath. Feels alive, not mechanical. 2D only — no Three.js.

**Construction** (`react-native-svg` + Reanimated):

1. **Core** — radial gradient, `amber.400` centre → `amber.300` edge, radius `R`.
2. **Halo** — same gradient at 35% opacity, radius `1.35R`, breathing slightly out of phase (~120ms lag) so the edge feels soft and alive rather than rigid.
3. **Grain** — a static, very low-opacity noise texture over the whole orb. This is what stops it looking like a CSS circle.
4. **Ambient drift** — a continuous ±1.5% scale oscillation on a ~7s cycle, independent of the breath. The orb is never perfectly still.

**Breath mapping.**

| Phase | Scale | Opacity |
|---|---|---|
| inhale | 0.62 → 1.0 | 0.75 → 1.0 |
| hold (full) | 1.0 (ambient drift only) | 1.0 |
| exhale | 1.0 → 0.62 | 1.0 → 0.75 |
| hold (empty) | 0.62 | 0.75 |

Scale interpolation is `easeInOutSine`, which matches how a breath actually accelerates and decelerates. Linear scaling feels mechanical and is subtly harder to follow.

**Physiological sigh** gets a modified curve: 0.62 → 0.85 (first inhale), a 180ms micro-hold, 0.85 → 1.0 (second, shorter inhale), then a long exhale to 0.62.

**Phase label.** A single word — *Breathe in* / *Hold* / *Breathe out* — in `heading`, cross-fading beneath the orb. Never a countdown number. Counting down is a stress cue.

**Themes.** `orb` is free. `wave` and `bloom` are Plus and are backlogged for implementation — the theme token and Prefs field exist in V1 so nothing needs restructuring later.

---

## Component inventory

Built on `heroui-native` where it fits, custom where it doesn't.

| Component | Notes |
|---|---|
| `Screen` | safe-area + background + scroll behaviour |
| `Card` | `sand.200` / `navy.800`, radius `lg`, soft shadow |
| `PrimaryButton` | `amber.400` fill, `navy.900` label, radius `full`, min-height 52 |
| `QuietButton` | text-only, `navy.300` — for every "Not Now" / "Skip" |
| `PanicFab` | 72×72, `amber.400`, subtle ambient breathing at rest |
| `Orb` | above |
| `SudsSlider` | 0–10, no numeric labels except the current value, skip affordance |
| `FeelingPicker` | three large emoji targets |
| `WorryCard` | `clay.300` tint |
| `Sheet` | `@gorhom/bottom-sheet` |
| `PaywallCard` | see `05-entitlements.md` |
| `EmptyState` | warm illustration slot + one calm sentence |

---

## Empty states

Never show a bare empty list. Each has one sentence, no exclamation marks, no call to action pressure.

| Screen | Copy |
|---|---|
| Worries, none pending | "Nothing waiting. That's a good place to be." |
| Journal, none yet | "Nothing written yet. There's no rush." |
| Progress, no data | "We'll start keeping track as you go." |

---

## Accessibility

- Contrast: body text ≥ 4.5:1, large text ≥ 3:1, in both themes. `amber.400` is a *fill*, never body-text colour on sand.
- Every interactive element has an `accessibilityLabel` and `accessibilityRole`.
- The orb has `accessibilityLiveRegion="polite"` announcing phase changes, so the breathing guidance works with VoiceOver/TalkBack and eyes closed.
- The panic FAB carries `accessibilityHint: "Starts a one-minute breathing session immediately."`
- Full keyboard/switch-control traversal on all forms.
- Haptics-only mode is fully usable: every breathing session can be followed with the screen off. This is a stated design goal, not a fallback.
