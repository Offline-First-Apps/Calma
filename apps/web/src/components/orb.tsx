/**
 * The orb, as the site's only mark.
 *
 * Inline SVG rather than an image file: it is three stops and a circle, it is
 * crisp at any size, it needs no network request, and it is the one element
 * that has to look identical to the app somebody is about to download.
 *
 * THE PROPORTIONS FOLLOW `systems/03`, NOT THE WEBSITE DESIGN — a 35% halo at
 * 1.35R. That was decided in session 9 for the app and the mark should not be
 * a different shape on the page that introduces it.
 *
 * IT DOES NOT BREATHE HERE. In the app the eleven-second loop is something to
 * follow; on a landing page it would be an ambient animation next to text
 * somebody is reading, which is the definition of a distraction. Reduced
 * motion is handled globally in `index.css` regardless.
 */
export function Orb({ size = 220 }: { size?: number }) {
  const id = `orb-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </radialGradient>
        {/* Highlight up and to the left, as everywhere else in the product:
            it is what makes the orb read as lit rather than filled. */}
        <radialGradient id={`${id}-core`} cx="45%" cy="38%" r="62%">
          <stop offset="0%" stopColor="var(--color-accent-core)" />
          <stop offset="62%" stopColor="var(--color-accent-soft)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="50" fill={`url(#${id}-halo)`} />
      <circle cx="50" cy="50" r="37" fill={`url(#${id}-core)`} />
    </svg>
  );
}
