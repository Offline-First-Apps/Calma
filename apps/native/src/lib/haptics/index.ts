import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * The haptic vocabulary (systems/04-audio-and-haptics.md).
 *
 * DURING BREATHING THIS IS NOT DECORATION -- IT IS THE GUIDANCE.
 *
 * A stated design goal is that a whole session can be followed with the
 * screen off. Someone lying in the dark at 3am should be able to put the
 * phone on their chest and breathe to it. That is why every moment below is
 * a named function rather than a raw `impactAsync` call at the point of use:
 * the vocabulary is small on purpose, and it has to stay small, or the
 * pattern stops being legible through a pocket.
 *
 * WHAT IS DELIBERATELY UNREACHABLE. `notificationAsync(Error)`,
 * `notificationAsync(Warning)` and `impactAsync(Rigid)` are not exported and
 * not wrapped. Nothing in Calma is an error, and nothing should feel sharp.
 * Because this module is the only permitted route to expo-haptics, there is
 * no way to reach them by accident -- see the lint rule note at the bottom.
 */

/**
 * Set from prefs at boot and on every change.
 *
 * A module-level flag rather than a hook because haptics fire from animation
 * callbacks on the UI thread, where there is no React context to read, and
 * because gating them must not re-render the calling screen (plan 04 T07).
 */
let enabled = true;

export function setHapticsEnabled(value: boolean): void {
  enabled = value;
}

export function hapticsEnabled(): boolean {
  return enabled;
}

/**
 * Every haptic swallows its own failure.
 *
 * Haptics are unavailable on plenty of devices, disabled by battery saver on
 * others, and unsupported on web. None of that is worth an error surfaced to
 * someone mid-breath -- the orb remains sufficient on its own.
 */
function fire(run: () => Promise<void>): void {
  if (!enabled) return;
  void run().catch(() => {});
}

const isAndroid = Platform.OS === 'android';

/**
 * `selectionAsync` maps to a very light click on Android and is inconsistent
 * across OEMs (D-003), so the Android path substitutes a Light impact rather
 * than relying on it. Intensity is not controllable on many Android devices;
 * we do not fight that.
 */
function selection(): Promise<void> {
  return isAndroid
    ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    : Haptics.selectionAsync();
}

// --- breathing -----------------------------------------------------------

/** Inhale begins. The lightest thing in the vocabulary. */
export function hapticInhale(): void {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** A hold begins, full or empty. */
export function hapticHold(): void {
  fire(selection);
}

/** Exhale begins. Heavier than the inhale, because the exhale is the work. */
export function hapticExhale(): void {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** Gap between the sigh's two taps, in ms. */
export const SIGH_DOUBLE_TAP_MS = 140;

/**
 * The sigh's second sip: two Light impacts, 140ms apart.
 *
 * The double tap is doing real work. The second sip is short and small, and
 * with the screen off it is the only way to tell it apart from the first --
 * a single tap would read as "inhale again" rather than "top it up".
 */
export function hapticSecondInhale(): void {
  if (!enabled) return;

  hapticInhale();
  // A timer is acceptable here and nowhere else in the engine: this is a
  // fixed 140ms gap inside one gesture, not a phase boundary, and nothing
  // visual is waiting on it.
  setTimeout(() => hapticInhale(), SIGH_DOUBLE_TAP_MS);
}

/** A full cycle has closed. */
export function hapticCycleComplete(): void {
  fire(selection);
}

/** The session is over. The only Success notification during breathing. */
export function hapticSessionComplete(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

// --- everywhere else ------------------------------------------------------

/**
 * The panic button was pressed. The heaviest haptic in the app, and the only
 * Heavy one -- it needs to land through a shaking hand.
 */
export function hapticPanic(): void {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}

export function hapticWorryCaptured(): void {
  fire(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

export function hapticWorryReleased(): void {
  fire(() =>
    Haptics.impactAsync(
      isAndroid ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
    ),
  );
}

export function hapticJournalSaved(): void {
  fire(selection);
}

/**
 * A discrete value was picked — a mark on the intensity scale.
 *
 * The lightest thing in the vocabulary that is not a breath. It exists so
 * that a control answered eleven times in a row does not have to borrow
 * `hapticJournalSaved`, which would put a "you finished something" feeling on
 * an act of adjusting a number.
 */
export function hapticSelection(): void {
  fire(selection);
}

export function hapticStreakReached(): void {
  fire(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/**
 * A tier limit was reached.
 *
 * Soft, and paired with the quietest sound in the app. Being told you have
 * hit a limit should not feel like an alarm.
 */
export function hapticTierLimit(): void {
  fire(() =>
    Haptics.impactAsync(
      isAndroid ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft,
    ),
  );
}

/*
 * NOTE FOR THE LINT RULE (plans/04 T06).
 *
 * `expo-haptics` must not be imported anywhere outside this directory, the
 * same way `react-native-mmkv` is confined to `packages/db`. Without that,
 * `Rigid` and `Error` are one autocomplete away from any screen, and the
 * first place someone will reach for an Error haptic is a validation failure
 * -- which is precisely the moment Calma has promised not to feel sharp.
 */
