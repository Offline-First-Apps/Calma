import { type AudioPlayer, createAudioPlayer } from 'expo-audio';

import {
  PRIORITY_SOUNDS,
  type SoundKey,
  soundKeys,
  soundManifest,
} from './manifest';

/**
 * Every sound in the app, preloaded once and arbitrated.
 *
 * WHY PRELOAD. The first play of an unloaded sound costs tens to hundreds of
 * milliseconds while the file is read and decoded. For `worryCaptured` that
 * lag is the difference between the pebble landing on the same beat as the
 * text dissolving and landing just after it -- which reads as the app being
 * slow rather than as one event. Loading all seven at boot costs a few
 * hundred kilobytes of memory and removes the problem entirely.
 *
 * WHY ARBITRATE. Two sounds at once is noise, and noise is the opposite of
 * the product. The rules, in order:
 *
 *   1. Nothing plays during an active breathing session except `sessionEnd`.
 *   2. Nothing plays over `sessionEnd` or `panic` while they are sounding.
 *   3. A repeat of the same key restarts it rather than layering.
 *
 * All three fail closed: when in doubt, stay quiet.
 */

type Players = Partial<Record<SoundKey, AudioPlayer>>;

let players: Players = {};
let loaded = false;

/** Gated on `prefs.soundEnabled`, set at boot and on change. */
let enabled = true;

/** Set for the whole duration of a breathing session. */
let sessionActive = false;

/** The priority sound currently sounding, and when it will be done. */
let holdingUntil = 0;

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  if (!value) stopAll();
}

export function soundEnabled(): boolean {
  return enabled;
}

/**
 * Marks a breathing session as running.
 *
 * Rule 1 is enforced here rather than at each call site because the call
 * sites are all over the app and none of them know a session is happening.
 */
export function setBreathingSessionActive(active: boolean): void {
  sessionActive = active;
}

/** Preloads every delivered sound. Safe to call more than once. */
export function loadSounds(): void {
  if (loaded) return;
  loaded = true;

  for (const key of soundKeys) {
    const spec = soundManifest[key];
    // A `null` module is a sound that has not been delivered yet. It is not
    // an error and must not become one -- see the note on `panic`.
    if (spec.module === null) continue;

    try {
      const player = createAudioPlayer(spec.module);
      player.volume = spec.volume;
      players[key] = player;
    } catch {
      // A sound that will not load is a sound that will not play. That is
      // the entire consequence, and it is not worth telling anyone about.
    }
  }
}

/**
 * Plays a sound, or does nothing, quietly.
 *
 * There is no error path and no return value on purpose. A caller that has
 * to think about whether the sound worked is a caller that will eventually
 * surface an audio failure to someone who is having a hard evening.
 */
export function playSound(key: SoundKey): void {
  if (!enabled) return;

  const player = players[key];
  if (!player) return;

  const now = Date.now();

  // Rule 1: silence during breathing, except for the sound that ends it.
  if (sessionActive && key !== 'sessionEnd') return;

  // Rule 2: a priority sound owns the room until it has finished.
  if (now < holdingUntil && !PRIORITY_SOUNDS.includes(key)) return;

  try {
    // Rule 3: restart rather than layer. `seekTo(0)` on an idle player is
    // harmless, and on a sounding one it is exactly the behaviour wanted --
    // a second pebble is one pebble, thrown again.
    //
    // It returns a promise; its rejection is caught here rather than left to
    // become an unhandled rejection, which in a release build is a crash
    // report for a sound that did not rewind.
    void player.seekTo(0).catch(() => {});
    player.volume = soundManifest[key].volume;
    player.play();

    if (PRIORITY_SOUNDS.includes(key)) {
      const durationMs = (player.duration || 0) * 1000;
      holdingUntil = now + durationMs;
    }
  } catch {
    // Swallowed. See above.
  }
}

/** Stops everything. Used when sound is switched off mid-playback. */
export function stopAll(): void {
  holdingUntil = 0;

  for (const key of soundKeys) {
    try {
      players[key]?.pause();
    } catch {
      // Nothing to do and nothing to say.
    }
  }
}

/**
 * Releases every player. Called on teardown.
 *
 * expo-audio players hold native resources; leaving seven of them behind on
 * every reload is how a development build ends up unable to play anything.
 */
export function unloadSounds(): void {
  for (const key of soundKeys) {
    try {
      players[key]?.remove();
    } catch {
      // Already gone.
    }
  }

  players = {};
  loaded = false;
  holdingUntil = 0;
}
