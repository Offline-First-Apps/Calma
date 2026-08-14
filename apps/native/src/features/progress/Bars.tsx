import { barGradient, type ChartBand } from '@calma/tokens';
import { useUniwind } from 'uniwind';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { Text } from '@/src/ui/Text';

/**
 * The bar charts on h1, h4 and h5.
 *
 * ONE COMPONENT, THREE SCREENS, AND THE DIFFERENCES ARE ALL PROPS. h1 and h4
 * draw the same seven days at 94px and 116px; h5 draws six months at 160px
 * with gridlines and per-bar bands. Building these separately is how two of
 * them drift apart.
 *
 * THE BARS ARE GRADIENTS. Every amber fill in Calma is a gradient with a glow
 * (`systems/03-design-system.md`), and session 9 shipped the buttons flat —
 * they read as dead swatches. These are 180deg two-stop rather than the
 * button's 158deg three-stop, because a bar is a quantity and giving it the
 * button's fill makes a chart look pressable.
 *
 * NOTHING HERE HAS AN AXIS, A ZERO LABEL OR A TARGET LINE. The H-group caption
 * is explicit: no goals, no rings, no comparisons. A y-axis on this chart
 * turns "when you sat down to breathe" into a score with a maximum.
 */

export interface Bar {
  /** 0…1 of the tallest bar in the set. */
  fraction: number;
  /** The label under the bar. Already localised. */
  label: string;
  /** h5 only. h1 and h4 are always amber. */
  band?: ChartBand;
}

const BAND_KEY = {
  often: 'accent',
  middle: 'clay',
  rarely: 'sage',
} as const satisfies Record<ChartBand, keyof typeof barGradient.light>;

/**
 * A day with nothing on it, in pixels.
 *
 * Drawn as a stub rather than as nothing at all, in `bar-track` rather than a
 * dimmed amber. The chart has to be able to say "not that day" without the gap
 * reading as a hole in a row of things you were supposed to do. It is
 * deliberately too short to be mistaken for a small amount of something.
 */
const EMPTY_BAR_HEIGHT = 6;

/** Below this fraction a bar would be indistinguishable from the empty stub. */
const MIN_VISIBLE_FRACTION = 0.08;

export function Bars({
  bars,
  height,
  gap = 8,
  radius = 8,
  gridlines = false,
  accessibilityLabel,
}: {
  bars: readonly Bar[];
  height: number;
  gap?: number;
  radius?: number;
  gridlines?: boolean;
  accessibilityLabel: string;
}) {
  const { theme } = useUniwind();
  const palette = theme === 'dark' ? barGradient.dark : barGradient.light;

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View style={{ position: 'relative' }}>
        {gridlines ? <Gridlines height={height} /> : null}

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap }}>
          {bars.map((bar, index) => {
            const empty = bar.fraction <= 0;
            const stops = palette[BAND_KEY[bar.band ?? 'often']];

            return (
              <View
                key={`${bar.label}-${index}`}
                style={{ flex: 1, height, justifyContent: 'flex-end' }}
              >
                {empty ? (
                  <View
                    className="bg-bar-track"
                    style={{
                      height: EMPTY_BAR_HEIGHT,
                      borderRadius: EMPTY_BAR_HEIGHT / 2,
                    }}
                  />
                ) : (
                  <BarFill
                    // A real session must never render shorter than the "you
                    // did nothing" stub, however short it was.
                    heightPx={
                      Math.max(bar.fraction, MIN_VISIBLE_FRACTION) * height
                    }
                    radius={radius}
                    stops={stops}
                    id={`bar-${bar.band ?? 'often'}`}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap, marginTop: 10 }}>
        {bars.map((bar, index) => (
          <Text
            key={`${bar.label}-${index}-label`}
            variant="caption"
            className="flex-1 text-center text-label-quiet"
          >
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * h5's four hairlines.
 *
 * They are spacing, not measurement — there is no number against any of them,
 * and that is on purpose. They give the tall chart something to sit against so
 * six months of bars do not float, without implying a scale to reach.
 */
function Gridlines({ height }: { height: number }) {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: 0, height }}
    >
      {[0, 1, 2, 3].map((line) => (
        <View
          key={line}
          className="bg-hairline-track"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: 1,
            top: (height - 1) * (line / 3),
          }}
        />
      ))}
    </View>
  );
}

function BarFill({
  heightPx,
  radius,
  stops,
  id,
}: {
  heightPx: number;
  radius: number;
  stops: readonly string[];
  id: string;
}) {
  return (
    <View style={{ height: heightPx, width: '100%' }}>
      <Svg width="100%" height="100%">
        <Defs>
          {/* 180deg is straight down, which in objectBoundingBox units is
              exactly x1=x2, y1=0, y2=1 — no aspect-ratio skew to correct
              for, unlike the button's 158deg. */}
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            {stops.map((color, i) => (
              <Stop
                key={color}
                offset={`${(i / (stops.length - 1)) * 100}%`}
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
          rx={radius}
          ry={radius}
          fill={`url(#${id})`}
        />
      </Svg>
    </View>
  );
}
