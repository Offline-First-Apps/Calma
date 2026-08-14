import { useUniwind } from 'uniwind';
import { View } from 'react-native';

import { Text } from '@/src/ui/Text';

import { type SudsPoint, dotColour } from './history';

/**
 * h5's lower chart: how you felt before each session.
 *
 * DOTS, AND NEVER A LINE. A line asserts the values in between, and there are
 * none — nobody was measuring on the days the app stayed shut. It is also the
 * cheapest possible compliance with plan 10 T09: a flat or worsening run has
 * to render without commentary, and a shape with no trend line, no fill and no
 * arrow has nothing to editorialise with.
 *
 * The axis is two words, "Heavier" and "Steadier", at the ends of the row. No
 * numbers: a 0-10 scale printed on a chart turns a feeling into a score, and
 * the SUDS value was only ever collected to make the orb's timing useful.
 *
 * COLOUR RUNS CLAY -> AMBER -> SAGE AS DISTRESS FALLS, which is the same
 * meaning those hues carry everywhere else: clay is something heavy you are
 * carrying, sage is something settled. It is a property of the dot's own
 * value, not of its position in the series, so an improving run and a
 * worsening one are drawn by exactly the same rule.
 */

/** The vertical band the dots sit in, in points. */
const TRAIL_HEIGHT = 96;
const DOT = 13;

export function SudsTrail({
  points,
  heavierLabel,
  steadierLabel,
  accessibilityLabel,
}: {
  points: readonly SudsPoint[];
  heavierLabel: string;
  steadierLabel: string;
  accessibilityLabel: string;
}) {
  const { theme } = useUniwind();
  const dark = theme === 'dark';

  return (
    <View accessible accessibilityLabel={accessibilityLabel}>
      <View
        style={{
          height: TRAIL_HEIGHT,
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingBottom: 4,
        }}
      >
        {/*
          The wash behind the dots. It sits under the middle of the range and
          is the only thing in this chart that could be read as a "normal"
          band — which is why it is 9% amber and has no edge. It is a place for
          the eye to rest, not a target zone.
        */}
        <View
          pointerEvents="none"
          className="bg-accent/10"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 8,
            height: 58,
            borderRadius: 30,
          }}
        />

        {points.map((point) => (
          <View
            key={point.at}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}
          >
            <View
              style={{
                width: DOT,
                height: DOT,
                borderRadius: DOT / 2,
                backgroundColor: dotColour(point.value, dark),
                // Higher SUDS sits higher: "heavier" is up. The scale is
                // inverted from the value because 10 is the worst, and the
                // labels below say which end is which.
                marginBottom:
                  ((point.value / 10) * (TRAIL_HEIGHT - DOT - 12)) | 0,
              }}
            />
          </View>
        ))}
      </View>

      <View className="flex-row justify-between">
        <Text variant="footnote" className="text-card-secondary">
          {heavierLabel}
        </Text>
        <Text variant="footnote" className="text-card-secondary">
          {steadierLabel}
        </Text>
      </View>
    </View>
  );
}
