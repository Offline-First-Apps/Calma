import { setAudioModeAsync } from 'expo-audio';

/**
 * The audio session, configured once at boot.
 *
 * Three decisions here, all of them about staying out of the way:
 *
 * SILENT SWITCH IS RESPECTED (`playsInSilentMode: false`). If someone has
 * silenced their phone at 2am, Calma does not override that to play a singing
 * bowl. Haptics still fire, so nothing is lost. Plenty of apps set this the
 * other way and call it focus; doing it in a mental-health app at night is
 * just taking something from someone without asking.
 *
 * WE MIX, WE NEVER DUCK (`interruptionMode: 'mixWithOthers'`). Someone may be
 * breathing along to their own music. A 0.8-second pebble should not lower
 * it. With the voice track removed (D-012) there is no exception left --
 * nothing in Calma ever reduces the volume of anything else.
 *
 * NOTHING PLAYS IN THE BACKGROUND. Calma has no reason to hold the audio
 * session once it is off screen, and holding it would show up in the now-
 * playing controls of a phone whose owner did not ask for that.
 */
export async function configureAudioSession(): Promise<void> {
  try {
    await setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    // Audio configuration failure is never surfaced. The app is fully usable
    // without sound -- the orb and the haptics carry the whole experience --
    // and boot cannot fail.
  }
}
