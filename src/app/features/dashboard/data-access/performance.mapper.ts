import { isoWeekOf } from '../../../shared/utils/iso-week';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';

export const PERFORMANCE_SERIES_LABEL = 'Durée (h)';
const SECONDS_PER_HOUR = 3600;
const HOURS_DECIMALS = 100;

/** Série journalière de la carte « Performances », en heures. `maxIndex` est `null` si aucune durée. */
export interface PerformanceSeries {
  labels: string[];
  hours: number[];
  maxIndex: number | null;
  totalSeconds: number;
}

export function toPerformanceSeries(api: DashboardKpisResponseApi): PerformanceSeries {
  const labels = api.daily.map((day) => formatDay(day.date));
  const hours = api.daily.map(
    (day) => Math.round((day.durationSeconds / SECONDS_PER_HOUR) * HOURS_DECIMALS) / HOURS_DECIMALS,
  );
  const maxIndex = indexOfMax(api.daily.map((day) => day.durationSeconds));
  const totalSeconds = api.daily.reduce((sum, day) => sum + day.durationSeconds, 0);

  return { labels, hours, maxIndex, totalSeconds };
}

/**
 * Même série regroupée par semaine ISO (une barre par semaine, libellée « S45 »). Utilisée en vue mois, où une
 * barre par jour ferait des dizaines de libellés redondants.
 */
export function toWeeklySeries(api: DashboardKpisResponseApi): PerformanceSeries {
  const secondsByWeek = new Map<string, number>();
  for (const day of api.daily) {
    const week = isoWeekOf(day.date);
    secondsByWeek.set(week, (secondsByWeek.get(week) ?? 0) + day.durationSeconds);
  }
  const weeks = [...secondsByWeek];
  const labels = weeks.map(([week]) => `S${week.slice(-2)}`);
  const hours = weeks.map(
    ([, seconds]) => Math.round((seconds / SECONDS_PER_HOUR) * HOURS_DECIMALS) / HOURS_DECIMALS,
  );
  const maxIndex = indexOfMax(weeks.map(([, seconds]) => seconds));
  const totalSeconds = weeks.reduce((sum, [, seconds]) => sum + seconds, 0);

  return { labels, hours, maxIndex, totalSeconds };
}

function indexOfMax(values: number[]): number | null {
  let best: number | null = null;
  values.forEach((value, index) => {
    if (value > 0 && (best === null || value > (values[best] ?? 0))) {
      best = index;
    }
  });
  return best;
}

/** Jour de la semaine abrégé, avec une majuscule et sans point (« Lun »), comme la maquette. */
function formatDay(isoDate: string): string {
  const weekday = new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'short',
    timeZone: 'UTC',
  });
  const clean = weekday.replace('.', '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
