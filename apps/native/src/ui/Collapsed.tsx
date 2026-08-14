import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, UIManager, View } from 'react-native';

import { Text } from './Text';

/**
 * A list that shows a few things and offers the rest behind "+X more".
 *
 * USED WHEREVER A LIST CAN GROW WITH SOMEBODY'S OWN CONTENT — the worry window
 * intro, saved entries, anywhere a count is unbounded. A screen that renders
 * everything is a screen that pushes its own action off the bottom the moment
 * a person actually uses the app.
 *
 * IT DOES NOT PAGE. The owner was explicit and right: a button that reveals
 * the next five is a button you have to press repeatedly to find out how much
 * there is. "+3 more" states the total and opens all of it at once, so the
 * question "how much am I carrying" is answered before you decide to look.
 *
 * THE EXPANDED SECTION SCROLLS INSIDE ITSELF rather than growing the page, so
 * whatever sits below — "I'm ready", a primary action — never moves and never
 * leaves the screen. That is the whole reason this is a component and not a
 * `slice(0, 5)` at each call site.
 */

/** Enough to see the shape of it; few enough to take in without reading. */
export const PREVIEW_COUNT = 5;

/** The tallest the opened list gets before it scrolls rather than grows. */
const EXPANDED_MAX_HEIGHT = 260;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export function Collapsed<T>({
  items,
  renderItem,
  keyFor,
  moreLabel,
  lessLabel,
  gap = 10,
}: {
  items: readonly T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyFor: (item: T, index: number) => string;
  /** Already localised, already given the hidden count. */
  moreLabel: (hidden: number) => string;
  lessLabel: string;
  gap?: number;
}) {
  const [open, setOpen] = useState(false);

  const hidden = Math.max(0, items.length - PREVIEW_COUNT);
  const shown = open ? items : items.slice(0, PREVIEW_COUNT);

  function toggle() {
    // A height change with no animation reads as the layout glitching. This
    // is the one place a `LayoutAnimation` is worth it: it is a deliberate
    // disclosure, not something happening under the person.
    LayoutAnimation.configureNext(
      LayoutAnimation.create(220, LayoutAnimation.Types.easeInEaseOut, LayoutAnimation.Properties.opacity),
    );
    setOpen((current) => !current);
  }

  const list = (
    <View style={{ gap }}>
      {shown.map((item, index) => (
        <View key={keyFor(item, index)}>{renderItem(item, index)}</View>
      ))}
    </View>
  );

  return (
    <View>
      {open ? (
        <ScrollView
          style={{ maxHeight: EXPANDED_MAX_HEIGHT }}
          showsVerticalScrollIndicator={false}
          // Nested inside a scrolling screen on some hosts; this keeps the
          // inner list scrollable rather than handing every drag to the page.
          nestedScrollEnabled
        >
          {list}
        </ScrollView>
      ) : (
        list
      )}

      {hidden > 0 ? (
        <Pressable
          onPress={toggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          className="mt-3 self-start active:opacity-70"
          hitSlop={10}
        >
          <Text variant="control" className="font-sans text-clay-ink">
            {open ? lessLabel : moreLabel(hidden)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
