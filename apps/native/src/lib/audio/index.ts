import { setHapticsEnabled } from '../haptics';
import {
  loadSounds,
  setBreathingSessionActive,
  setSoundEnabled,
  unloadSounds,
} from './SoundBank';
import { configureAudioSession } from './session';

export { playSound, setBreathingSessionActive, stopAll } from './SoundBank';
export type { SoundKey } from './manifest';
export { soundManifest } from './manifest';

/**
 * Audio and haptics, gated on preferences.
 *
 * WHY THESE ARE MODULE FLAGS AND NOT A HOOK.
 *
 * Both are triggered from places React cannot reach: animation-completion
 * callbacks on the UI thread, and effects that must not cause a render. Plan
 * 04 T07 requires the gate to take effect immediately "with no re-render of
 * the calling screen", and a `useSoundEnabled()` hook would do the opposite
 * -- every screen that could make a noise would re-render when someone
 * toggled a switch in Settings.
 *
 * So preferences push into these modules, and nothing pulls.
 */

/** Called once from the boot gate, after prefs are hydrated. */
export async function initAudio(prefs: {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}): Promise<void> {
  applyAudioPrefs(prefs);
  await configureAudioSession();
  loadSounds();
}

/** Called whenever `soundEnabled` or `hapticsEnabled` changes. */
export function applyAudioPrefs(prefs: {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}): void {
  setSoundEnabled(prefs.soundEnabled);
  setHapticsEnabled(prefs.hapticsEnabled);
}

export function teardownAudio(): void {
  setBreathingSessionActive(false);
  unloadSounds();
}
