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
