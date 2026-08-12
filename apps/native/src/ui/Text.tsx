import { Text as HeroText } from 'heroui-native';
import type { TextProps as RNTextProps } from 'react-native';

/**
 * THE MOST IMPORTANT COMPONENT IN THE APP.
 *
 * Calma uses two typefaces and the split is the whole idea (D-017):
 *   serif (Newsreader) — sentences a person is meant to FEEL
 *   sans  (Figtree)    — everything they only need to READ
 *
 * A serif "Save" button reads precious. A sans "Breathe into it." reads like a
 * system notification. Choosing the variant IS choosing the tone.
 *
 * Note `text-warm` on serif variants: in dark mode that resolves to cream
 * rather than the cool grey used for UI copy, so emotional lines stay warm.
 *
 * WEIGHT IS SELECTED BY FAMILY, NEVER BY `font-medium`.
 *
 * expo-font registers every face under its own family name, so asking for
 * `font-sans font-medium` gets Figtree Regular on iOS and, on some Android
 * builds, Roboto. It fails silently -- no error, no warning, just an app
 * where half the intended emphasis is missing. `font-sans-medium` names the
 * registered face directly and cannot be got wrong.
 */
const variants = {
  /** Splash wordmark, panic ending. The largest thing in the app. */
  display: 'font-serif text-[38px] leading-[45px] tracking-[-0.4px] text-warm',
  /** Screen-opening emotional lines. "Breathe into it." */
  title: 'font-serif text-[36px] leading-[43px] tracking-[-0.36px] text-warm',
  /** Between title and heading. Used where an emotional line shares a
   * screen with something else -- d5's extension offer, d6's feeling check. */
  titleSm: 'font-serif text-[34px] leading-[41px] tracking-[-0.34px] text-warm',
  /** Question headings. "What brings you here?" */
  heading: 'font-serif text-[32px] leading-[39px] tracking-[-0.32px] text-warm',
  /** Smaller emotional line where a heading must share space. */
  headingSm: 'font-serif text-[27px] leading-[34px] tracking-[-0.27px] text-warm',

  /** DOMINANT BODY SIZE — the most used value across all 58 screens. */
  body: 'font-sans text-[21px] leading-[31px] text-foreground',
  bodyEmphasis: 'font-sans-medium text-[21px] leading-[31px] text-foreground',
  /** Buttons and control labels. */
  control: 'font-sans-medium text-[18px] leading-[24px] text-foreground',
  /** Supporting copy, hints, secondary rows. */
  callout: 'font-sans text-[17px] leading-[26px] text-muted',
  /** Chip and pill labels. */
  label: 'font-sans-medium text-[15px] leading-[20px] text-foreground',
  /** Timestamps, meta, fine print. */
  caption: 'font-sans-medium text-[13px] leading-[18px] tracking-[0.13px] text-muted',
} as const;

export type TextVariant = keyof typeof variants;

export function Text({
  variant = 'body',
  className = '',
  ...props
}: RNTextProps & { variant?: TextVariant; className?: string }) {
  // allowFontScaling is never disabled. Every numeral scales with the system
  // font setting — supporting scaling everywhere EXCEPT numbers is worse than
  // not supporting it at all. (plans/19-review-findings.md R2)
  return <HeroText className={`${variants[variant]} ${className}`} allowFontScaling {...props} />;
}
