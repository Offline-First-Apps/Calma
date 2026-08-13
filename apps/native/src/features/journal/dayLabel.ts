import { describeDay } from '@calma/i18n';
import { useTranslation } from 'react-i18next';

/**
 * "Friday night". "Last Sunday". "Two weeks ago."
 *
 * G5, G6 and G7 all date entries this way and g6's caption is explicit about
 * why: "Days feel like days -- 'Tuesday evening', not a timestamp." A journal
 * is not a log. Someone scrolling back is looking for the night they
 * remember, and a precise timestamp on a bad evening reads back like evidence
 * rather than like a memory.
 *
 * The branching lives in `@calma/i18n`'s `describeDay`, which is pure and
 * tested in Node. This hook only picks the key, so a locale can rephrase
 * "Last Sunday" without touching calendar logic, and calendar logic cannot be
 * changed by editing a translation.
 */
const TODAY = {
  morning: 'day.todayMorning',
  afternoon: 'day.todayAfternoon',
  evening: 'day.todayEvening',
  night: 'day.todayNight',
} as const;

const WEEKDAY = {
  morning: 'day.weekdayMorning',
  afternoon: 'day.weekdayAfternoon',
  evening: 'day.weekdayEvening',
  night: 'day.weekdayNight',
} as const;

export function useDayLabel(): (timestamp: number) => string {
  const { t, i18n } = useTranslation('journal');

  return (timestamp: number) => {
    const label = describeDay(new Date(timestamp), i18n.language);

    switch (label.kind) {
      case 'today':
        return t(TODAY[label.partOfDay]);
      case 'yesterday':
        return t('day.yesterday');
      case 'thisWeek':
        return t(WEEKDAY[label.partOfDay], { weekday: label.weekday });
      case 'lastWeek':
        return t('day.lastWeekday', { weekday: label.weekday });
      case 'weeksAgo':
        // Numeric, not spelled out. The design writes "Two weeks ago"; no
        // JavaScript Intl API spells a number out, and a hand-written table
        // of number words per locale is a translation bug waiting to happen.
        // Recorded in plans/09 T11.
        return t('day.weeksAgo', { count: label.weeks });
      case 'date':
        return label.date;
    }
  };
}
