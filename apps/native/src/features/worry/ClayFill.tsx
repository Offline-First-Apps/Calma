import { amberGradientStops, clayGradient } from '@calma/tokens';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useUniwind } from 'uniwind';

/**
 * The clay gradient, as a pill-shaped fill behind a button's label.
 *
 * Same construction as `Button`'s `AmberFill` and for the same reason: every
 * filled control in the designs is a three-stop gradient with a coloured glow
 * beneath it, and a flat `bg-clay` reads as a swatch of paint rather than a
 * material. See the long note in `src/ui/Button.tsx`.
 *
 * It is separate from `Button` rather than a fifth variant of it because it
 * belongs to one screen. `Button`'s variants are the app's vocabulary —
 * primary, secondary, immersive, quiet — and adding `clay` to them would
 * invite clay buttons onto screens that are not about worry, which would
 * spend the one hue this feature has.
 *
 * Offsets are shared with the amber button (0 / 52 / 100) — the shape of the
 * gradient is the app's, only the colour is the feature's.
 */
export function ClayFill({ height }: { height: number }) {
  const { theme } = useUniwind();
  const stops =
    theme === 'dark' ? clayGradient.dark.button : clayGradient.light.button;
  const offsets = amberGradientStops.button;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      <Svg width="100%" height="100%">
        <Defs>
          {/* 158deg expressed as its dominant component, as in `AmberFill`:
              in objectBoundingBox units an angle is skewed by the box's
              aspect ratio, and on a 54px pill the error is under a pixel. */}
          <LinearGradient id="clayButton" x1="0" y1="0" x2="0.22" y2="1">
            {stops.map((color, index) => (
              <Stop
                key={color}
                offset={`${offsets[index]! * 100}%`}
                stopColor={color}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx={height / 2}
          ry={height / 2}
          fill="url(#clayButton)"
        />
      </Svg>
    </View>
  );
}
