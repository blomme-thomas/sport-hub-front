import { addIsoDays } from './iso-date';

/** Semaine ISO au format `AAAA-Www`, par exemple `2026-W46`. */
export type IsoWeek = string;

const WEEK_PATTERN = /^(\d{4})-W(\d{2})$/;
const DAYS_PER_WEEK = 7;

/** Semaine ISO (lundi à dimanche) qui contient la date `YYYY-MM-DD`. */
export function isoWeekOf(isoDate: string): IsoWeek {
  const weekday = (new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7;
  // Le jeudi de la semaine détermine l'année ISO et le numéro de semaine.
  const thursday = addIsoDays(isoDate, 3 - weekday);
  const year = thursday.slice(0, 4);
  const dayOfYear =
    (Date.parse(`${thursday}T00:00:00Z`) - Date.parse(`${year}-01-01T00:00:00Z`)) /
      (24 * 60 * 60 * 1000) +
    1;
  const week = Math.floor((dayOfYear - 1) / DAYS_PER_WEEK) + 1;
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/** Lundi (`YYYY-MM-DD`) de la semaine ISO donnée. */
export function mondayOfIsoWeek(week: IsoWeek): string {
  const match = WEEK_PATTERN.exec(week);
  if (match === null) {
    throw new Error(`Semaine ISO invalide : ${week}`);
  }
  const year = Number(match[1]);
  const number = Number(match[2]);
  // Le lundi de la semaine 1 est le lundi de la semaine qui contient le 4 janvier.
  const january4 = `${year}-01-04`;
  const weekday = (new Date(`${january4}T00:00:00Z`).getUTCDay() + 6) % 7;
  const firstMonday = addIsoDays(january4, -weekday);
  return addIsoDays(firstMonday, (number - 1) * DAYS_PER_WEEK);
}

/** Semaine ISO décalée de `count` semaines (négatif pour revenir en arrière). */
export function shiftIsoWeek(week: IsoWeek, count: number): IsoWeek {
  return isoWeekOf(addIsoDays(mondayOfIsoWeek(week), count * DAYS_PER_WEEK));
}
