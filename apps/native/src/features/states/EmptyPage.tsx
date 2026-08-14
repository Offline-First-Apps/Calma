import { View } from 'react-native';

import { Text } from '@/src/ui/Text';

/**
 * k1 — the empty state.
 *
 * *"Nothing here yet, and that's fine." / "Some people write every night,
 * some never do."*
 *
 * BOTH SENTENCES ARE LOAD-BEARING. The first refuses to treat emptiness as a
 * problem; the second refuses to treat writing as the goal. Between them there
 * is no call to action, and that is the whole design — an empty state with a
 * "Start writing" button underneath is a screen telling you to do the thing
 * you have just chosen not to do.
 *
 * The illustration is a drawn page with three ruled lines, not an icon and not
 * a character. The K-group caption: *"these are where a calm app usually turns
 * into software"*, and a shrugging mascot is exactly that.
 */
export function EmptyPage({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-7">
      <PageMark />

      <Text
        variant="headingSm"
        className="max-w-[300px] text-center text-[27px] leading-[36px]"
      >
        {title}
      </Text>
      <Text
        variant="callout"
        className="max-w-[300px] text-center text-[17px] leading-[26px] text-card-secondary"
      >
        {body}
      </Text>
    </View>
  );
}

/**
 * A page with three lines on it, shortening as they go down.
 *
 * The shortening is the only thing that makes it read as writing rather than
 * as a table: three equal rules are a list, three ragged ones are a paragraph.
 */
function PageMark() {
  return (
    <View style={{ width: 132, height: 132 }}>
      <View className="absolute inset-0 rounded-[34px] border border-border-empty-page bg-surface-empty-page" />
      {[
        { top: 44, right: 30 },
        { top: 62, right: 44 },
        { top: 80, right: 56 },
      ].map((rule) => (
        <View
          key={rule.top}
          className="absolute bg-empty-page-rule"
          style={{
            left: 30,
            right: rule.right,
            top: rule.top,
            height: 2,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}
