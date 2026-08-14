import { Children, isValidElement, type ReactNode } from 'react';
import { View } from 'react-native';

import { Enter } from './Enter';

/**
 * A screen's contents, settling in one after another.
 *
 * WHY THIS EXISTS RATHER THAN `<Enter index={0}>`, `<Enter index={1}>`, …
 *
 * Hand-numbered indices are wrong the first time somebody inserts a section
 * in the middle, and the failure is silent: two elements share a delay and
 * arrive together, which reads as one element rather than as a mistake. The
 * order on screen IS the order they should arrive in, so it is read from the
 * children rather than restated beside them.
 *
 * IT COUNTS ONLY REAL CHILDREN.
 *
 * Conditional sections in this app are written as `{x ? <View/> : null}`, and
 * a `null` that consumed an index would leave a gap in the rhythm whose size
 * depended on state — the same screen would stagger differently depending on
 * whether somebody had a worry waiting. Nulls are skipped.
 *
 * WHAT IT IS NOT.
 *
 * Not a list animation. A list whose items animate in individually turns
 * somebody's own journal into a performance, and the entrance should be over
 * before it is noticed as one. `Enter`'s whole vocabulary is opacity plus ten
 * points of upward drift — no spring, no overshoot, nothing from the side
 * (`systems/03`).
 */
export function Stagger({
  children,
  /** Shifts the whole group, for content below something already animating. */
  from = 0,
  delay = 0,
  enabled = true,
  className,
  style,
}: {
  children: ReactNode;
  from?: number;
  delay?: number;
  enabled?: boolean;
  className?: string;
  style?: View['props']['style'];
}) {
  let index = from;

  return (
    <View className={className} style={style}>
      {Children.map(children, (child) => {
        if (!isValidElement(child)) return child;

        const wrapped = (
          <Enter index={index} delay={delay} enabled={enabled}>
            {child}
          </Enter>
        );
        index += 1;
        return wrapped;
      })}
    </View>
  );
}
