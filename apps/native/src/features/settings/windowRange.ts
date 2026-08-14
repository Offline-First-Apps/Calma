/**
 * "8–8:20pm" — the worry window, as one range rather than two settings.
 *
 * j1 shows the start and the length as a single value, and that is the honest
 * shape: nobody thinks of their window as "20:00" plus "20 minutes", they
 * think of it as the twenty minutes after eight. Two rows would also make the
 * length feel like a thing to maximise.
 *
 * THE DASH IS AN EN DASH AND THE FIRST HALF DROPS ITS SUFFIX when both ends
 * share it — "8–8:20pm", not "8:00pm–8:20pm". That is how the design writes it
 * and how a person says it. Locales whose formatter does not produce a
 * suffix (24-hour clocks) simply never trigger the trim.
 *
 * Pure, and it takes the formatter as an argument, so it can be tested in Node
 * without booting i18next.
 */
export function windowRange(
  startHHmm: string,
  minutes: number,
  locale: string,
  format: (hhmm: string, locale: string) => string,
): string {
  const end = addMinutes(startHHmm, minutes);

  const startText = format(startHHmm, locale);
  const endText = format(end, locale);

  return `${trimSharedSuffix(startText, endText)}–${endText}`;
}

/** `HH:mm` plus whole minutes, wrapping past midnight. */
export function addMinutes(hhmm: string, minutes: number): string {
  const [hours, mins] = hhmm.split(':').map(Number) as [number, number];
  const total = (hours * 60 + mins + minutes + 24 * 60) % (24 * 60);

  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h < 10 ? '0' : ''}${h}:${m < 10 ? '0' : ''}${m}`;
}

/**
 * Drops a suffix the two ends share, plus any `:00` the start does not need.
 *
 * "8:00 pm" against "8:20 pm" becomes "8". Anything that does not match this
 * shape is returned untouched — a locale that formats differently gets the
 * long form rather than a mangled one, which is the right way to fail.
 */
function trimSharedSuffix(start: string, end: string): string {
  const suffix = /\s*[APap][Mm]\.?$/.exec(end)?.[0];
  if (suffix === undefined) return start;
  if (!start.endsWith(suffix)) return start;

  const trimmed = start.slice(0, -suffix.length).trimEnd();
  return trimmed.endsWith(':00') ? trimmed.slice(0, -3) : trimmed;
}
