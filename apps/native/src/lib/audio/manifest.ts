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
 * PANIC IS DELIBERATELY UNSHIPPED. READ THIS BEFORE FILLING IT IN.
 *
 * The delivered file assigned to `panic` by elimination
 * (`Create_a_very_short__#1-...mp3`) is not the sound the spec describes. Its
 * fundamental sits at roughly 31 Hz, with 86% of its energy between 30 and
 * 60 Hz and only 1.9% in the specified 80-120 Hz band. Nearly 90% of it is
 * below 300 Hz, which no phone speaker can reproduce.
 *
 * On a laptop with a subwoofer it is a deep, convincing drum. On the device
 * it is meant for, it is close to silence with a faint click in it.
 *
 * This is the one sound a person hears at their worst moment, so plan 04 T02
 * says to stop and flag rather than ship the wrong one. That is what this
 * `null` is. It needs regenerating with a fundamental in the 80-120 Hz band
 * before the panic path in plan 07 can be called done.
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
    module: null,
    volume: 1,
    description:
      'A deep wooden drum, fundamental 80-120 Hz. NOT YET DELIVERED - see above.',
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
