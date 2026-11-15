import { addIsoDays } from '../../../shared/utils/iso-date';
import type { MonthActivity, MonthDay } from '../models/training-month.model';

const DAYS_PER_WEEK = 7;

/**
 * Grille du mois, semaines de lundi à dimanche. `monthStart` est le 1er du mois (`YYYY-MM-01`).
 * Les cases des mois voisins servent à compléter les semaines et sont marquées `inMonth: false`.
 */
export function buildMonthWeeks(
  monthStart: string,
  activitiesByDate: ReadonlyMap<string, readonly MonthActivity[]>,
  today: string,
): MonthDay[][] {
  const month = monthStart.slice(0, 7);
  const [year, monthNumber] = month.split('-').map(Number) as [number, number];
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  // getUTCDay : 0 = dimanche. Le lundi doit valoir 0.
  const leading = (new Date(`${monthStart}T00:00:00Z`).getUTCDay() + 6) % 7;
  const cellCount = Math.ceil((leading + daysInMonth) / DAYS_PER_WEEK) * DAYS_PER_WEEK;
  const firstCell = addIsoDays(monthStart, -leading);

  const days: MonthDay[] = Array.from({ length: cellCount }, (_, index) => {
    const date = addIsoDays(firstCell, index);
    const activities = activitiesByDate.get(date) ?? [];
    return {
      date,
      dayOfMonth: Number(date.slice(8)),
      inMonth: date.startsWith(month),
      isToday: date === today,
      activities,
      label: dayLabel(date, activities),
    };
  });

  const weeks: MonthDay[][] = [];
  for (let start = 0; start < days.length; start += DAYS_PER_WEEK) {
    weeks.push(days.slice(start, start + DAYS_PER_WEEK));
  }
  return weeks;
}

/** Premier jour du mois contenant `isoDate`. */
export function firstDayOfMonth(isoDate: string): string {
  return `${isoDate.slice(0, 7)}-01`;
}

/** Le même jour, `count` mois plus loin (le 1er reste le 1er). */
export function shiftMonth(monthStart: string, count: number): string {
  const date = new Date(`${monthStart}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + count);
  return date.toISOString().slice(0, 10);
}

function dayLabel(date: string, activities: readonly MonthActivity[]): string {
  const day = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
  return [
    day,
    ...activities.map((activity) => `${activity.typeLabel}, ${activity.durationLabel}`),
  ].join(', ');
}
