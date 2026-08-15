/**
 * The sound manifest (systems/04-audio-and-haptics.md).
 *
 * Calma ships seven sounds and no speech (D-012). Every one of them -- a
 * pebble, a bowl, leaves, a drum, a bell, glass notes, a pencil -- is
 * language-neutral, so the audio design works in every locale with zero
 * translation work.
 *
 * `require` is resolved by metro at build time, so a renamed or missing file
 * is a bundler error rather than a sound that silently does not play.
 */

export type SoundKey =
  | 'sessionEnd'
  | 'worryCaptured'
  | 'worryReleased'
  | 'journalSaved'
  | 'streakAchieved'
  | 'panic'
  | 'tierLimit';

export interface SoundSpec {
  /**
   * The bundled asset, or `null` for a sound that is not yet shippable.
   *
   * A `null` here is louder than a missing file: `SoundBank` treats it as a
   * silent no-op and everything else keeps working, but the key still exists
   * so the call sites can be written and the gap stays visible in one place.
   */
  module: number | null;
  /**
   * Relative playback volume, so nothing jumps out.
   *
   * Every file is peak-normalised to -3 dBFS, which makes these numbers the
   * only thing setting the balance between them. They are not arbitrary: the
   * tier-limit bell is the quietest sound in the app on purpose, because
   * being told you have hit a limit should not feel like an alarm.
   */
  volume: number;
  /** Description, kept next to the asset so a wrong file is obvious. */
  description: string;
}

/**
 * PANIC, AND WHY THIS ONE FILE IS SYNTHESISED RATHER THAN RECORDED.
 *
 * The delivered file assigned to `panic` by elimination
 * (`Create_a_very_short__#1-...mp3`) was not the sound the spec describes.
 * Its fundamental sat at roughly 31 Hz, with 86% of its energy between 30 and
 * 60 Hz and only 1.9% in the specified 80-120 Hz band. On a laptop with a
 * subwoofer it was a deep, convincing drum. On the device it is meant for it
 * was close to silence with a faint click in it, because no phone speaker
 * moves air that low.
 *
 * It shipped as `null` for four sessions rather than shipping wrong, which
 * plan 04 T02 asks for. `null` is a silent no-op in the bank, so the panic
 * path worked and made no sound at all.
 *
 * `panic.wav` is a generated one-shot: a 100 Hz drum head with its Bessel
 * modes, a wooden shell at 137 Hz, a downward pitch glide over the first
 * 60ms, a low-passed mallet transient and a 1.25s decay. It carries integer
 * harmonics at 200, 300 and 400 Hz deliberately -- a phone speaker is deaf
 * below roughly 400 Hz, and those are what let the ear reconstruct a
 * fundamental it cannot actually hear. Measured against the old file: 100 Hz
 * is now the loudest component and everything below 80 Hz is at least 28 dB
 * down.
 *
 * WAV RATHER THAN M4A, AND THAT IS AN IMPROVEMENT ON THE SPEC.
 *
 * `systems/04` converts to m4a because MP3 encoding inserts 20-50ms of
 * encoder-delay padding, and this sound must fire on the same frame as the
 * haptic. WAV has no encoder delay at all -- it is the case m4a was the
 * workaround for. 110KB for the one sound that has to be right.
 *
 * NORMALISED TO -3 dBFS PEAK, not to a loudness target. `systems/04`'s own
 * ffmpeg line uses `loudnorm`, which contradicts the "-3 dBFS peak" the same
 * document requires; that contradiction is open item 10 in
 * `progress/00-START-HERE.md` and this file resolves it in favour of what was
 * asked for.
 *
 * IT HAS NOT BEEN HEARD BY ANYONE. Generated and measured, never played.
 * This is the first sound to check on a real device, at low volume, at night.
 */
export const soundManifest: Readonly<Record<SoundKey, SoundSpec>> = {
  sessionEnd: {
    module: require('@/assets/audio/session-end.m4a'),
    volume: 0.9,
    description: 'Single soft strike of a low singing bowl, slow natural decay.',
  },
  worryCaptured: {
    module: require('@/assets/audio/worry-captured.m4a'),
    volume: 0.65,
    description: 'One small smooth pebble into still water.',
  },
  worryReleased: {
    module: require('@/assets/audio/worry-released.m4a'),
    volume: 0.7,
    description: 'A handful of dry autumn leaves in a short gust.',
  },
  journalSaved: {
    module: require('@/assets/audio/journal-saved.m4a'),
    volume: 0.6,
    description: 'A pencil stroke on textured paper, then a palm pressing flat.',
  },
  streakAchieved: {
    module: require('@/assets/audio/streak-achieved.m4a'),
    volume: 0.8,
    description: 'Two soft glass notes struck in sequence, briefly overlapping.',
  },
  panic: {
    module: require('@/assets/audio/panic.wav'),
    volume: 1,
    description:
      'A deep wooden drum, fundamental 100 Hz. Synthesised - see above.',
  },
  tierLimit: {
    module: require('@/assets/audio/tier-limit.m4a'),
    volume: 0.5,
    description: 'A small brass bell tapped lightly. Emotionally neutral.',
  },
};

/**
 * Sounds that outrank everything else while they are playing.
 *
 * `sessionEnd` closes a session and `panic` opens one; a pebble landing over
 * either would turn a moment into a collision.
 */
export const PRIORITY_SOUNDS: readonly SoundKey[] = ['sessionEnd', 'panic'];

export const soundKeys = Object.keys(soundManifest) as SoundKey[];
