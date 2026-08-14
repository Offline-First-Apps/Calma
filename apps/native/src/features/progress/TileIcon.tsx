import { View } from 'react-native';

/**
 * The four medallions on h1, h4 and h5.
 *
 * DRAWN, NOT AN ICON FONT. Each is two or three Views — a ring, a half-ring, a
 * rotated 2px line, a three-quarter arc. `@expo/vector-icons` has near-enough
 * shapes for all four and they are not these: the designs use a stroke weight
 * and a proportion that read as a mark rather than as UI furniture, and a
 * near-enough icon here would be the first place in the app where the drawing
 * came from a library's idea of "breathing" instead of the designer's.
 *
 * Each tint is the feature's own hue, everywhere in the app: amber for
 * breathing, clay for worry, neutral for writing, sage for the streak. i1's
 * caption already spent this argument — drawing one neutral medallion four
 * times would be cheaper, and would be the only place in Calma where a colour
 * that means something everywhere else suddenly means nothing.
 */

export type TileKind = 'breathing' | 'worries' | 'writing' | 'streak';

const SURFACE: Record<TileKind, string> = {
  breathing: 'bg-surface-tile-accent border-border-tile-accent',
  worries: 'bg-surface-tile-clay border-border-tile-clay',
  writing: 'bg-surface-tile-neutral border-border-tile-neutral',
  streak: 'bg-surface-tile-sage border-border-tile-sage',
};

const GLYPH: Record<TileKind, string> = {
  breathing: 'border-glyph-accent',
  worries: 'border-glyph-clay',
  writing: 'bg-glyph-neutral',
  streak: 'border-glyph-sage',
};

export function TileIcon({ kind }: { kind: TileKind }) {
  return (
    <View
      className={`h-10 w-10 flex-none items-center justify-center rounded-[14px] border ${SURFACE[kind]}`}
    >
      <Glyph kind={kind} />
    </View>
  );
}

function Glyph({ kind }: { kind: TileKind }) {
  switch (kind) {
    /** A breath: a complete ring, 18px, 2px stroke. */
    case 'breathing':
      return (
        <View
          className={`rounded-full border-2 ${GLYPH.breathing}`}
          style={{ width: 18, height: 18 }}
        />
      );

    /**
     * A worry set down: the lower half of a ring, open at the top. The same
     * mark the Worries tab carries, and it is a bowl rather than a cloud.
     */
    case 'worries':
      return (
        <View
          className={`border-2 border-t-0 ${GLYPH.worries}`}
          style={{
            width: 20,
            height: 11,
            borderBottomLeftRadius: 11,
            borderBottomRightRadius: 11,
          }}
        />
      );

    /** A pencil: a 2px line at 34 degrees. No nib, no eraser, no clipart. */
    case 'writing':
      return (
        <View
          className={GLYPH.writing}
          style={{
            width: 2,
            height: 19,
            borderRadius: 1,
            transform: [{ rotate: '34deg' }],
          }}
        />
      );

    /**
     * Showing up: three quarters of a ring, open at the lower right.
     *
     * DELIBERATELY NOT CLOSED. A complete ring is a progress ring, and a
     * progress ring is a target with a remainder — the one shape the H-group
     * caption rules out by name. This one is going round and has not finished,
     * which is the honest picture of a streak.
     */
    case 'streak':
      return (
        <View
          className={`rounded-full border-2 border-b-transparent border-r-transparent ${GLYPH.streak}`}
          style={{ width: 16, height: 16 }}
        />
      );
  }
}
