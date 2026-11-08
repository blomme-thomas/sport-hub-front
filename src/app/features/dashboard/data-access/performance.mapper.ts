import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import type { ChartModel } from '../models/training-stats.model';

export const PERFORMANCE_SERIES_LABEL = 'Durée (h)';
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const HOURS_DECIMALS = 100;

/** Série journalière de la carte « Vos performances », en heures. `maxIndex` est `null` si aucune durée. */
export interface PerformanceSeries {
  labels: string[];
  hours: number[];
  maxIndex: number | null;
  /** Phrase lisible pour le point maximum, ex. « 3h 12min le 7 nov. ». */
  maxLabel: string | null;
  totalSeconds: number;
}

export function toPerformanceSeries(api: DashboardKpisResponseApi): PerformanceSeries {
  const labels = api.daily.map((day) => formatDay(day.date));
  const hours = api.daily.map(
    (day) => Math.round((day.durationSeconds / SECONDS_PER_HOUR) * HOURS_DECIMALS) / HOURS_DECIMALS,
  );
  const maxIndex = indexOfMax(api.daily.map((day) => day.durationSeconds));
  const totalSeconds = api.daily.reduce((sum, day) => sum + day.durationSeconds, 0);

  return {
    labels,
    hours,
    maxIndex,
    maxLabel:
      maxIndex === null
        ? null
        : `${formatHoursMinutesLong(api.daily[maxIndex]?.durationSeconds ?? 0)} le ${labels[maxIndex]}`,
    totalSeconds,
  };
}

/** Modèle de tableau accessible pour la série : une ligne par jour. */
export function toPerformanceTable(series: PerformanceSeries): ChartModel {
  return {
    title: 'Durée par jour',
    labels: series.labels,
    series: [
      { label: PERFORMANCE_SERIES_LABEL, values: series.hours, cssVar: '--sh-chart-series-1' },
    ],
    unit: 'h',
  };
}

/** « 3h 12min » ; « 45min » sous une heure. */
export function formatHoursMinutesLong(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return hours === 0 ? `${minutes}min` : `${hours}h ${String(minutes).padStart(2, '0')}min`;
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

function formatDay(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}
