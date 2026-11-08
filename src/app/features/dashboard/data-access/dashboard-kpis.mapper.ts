import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import type { DashboardKpi } from '../models/dashboard-kpi.model';
import type { VariationDirection, VariationView } from '../models/training-stats.model';

const ABSENT = '—';
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MINUS_SIGN = '−';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const INTEGER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

const DIRECTION_LABELS: Record<VariationDirection, string> = {
  up: 'En hausse',
  down: 'En baisse',
  flat: 'Stable',
  unknown: 'Non disponible',
};

/** Convertit la réponse du back en cinq indicateurs d'affichage, dans l'ordre du bandeau. */
export function toDashboardKpis(api: DashboardKpisResponseApi): DashboardKpi[] {
  const { totals, averageHeartRate, daily } = api;
  return [
    {
      id: 'sessions',
      label: 'Séances',
      value: INTEGER_FORMAT.format(totals.count),
      unit: null,
      tone: 'accent',
      variation: null,
      series: daily.map((day) => day.count),
    },
    {
      id: 'duration',
      label: 'Durée totale',
      value: formatHoursMinutes(totals.durationSeconds),
      unit: null,
      tone: 'success',
      variation: toDurationVariation(api.variation),
      series: daily.map((day) => day.durationSeconds / SECONDS_PER_HOUR),
    },
    {
      id: 'calories',
      label: 'Calories brûlées',
      value: formatInteger(totals.calories),
      unit: totals.calories === null ? null : 'kcal',
      tone: 'orange',
      variation: null,
      series: daily.map((day) => day.calories),
    },
    {
      id: 'elevation',
      label: 'Dénivelé positif',
      value: formatInteger(totals.elevationGainMeters),
      unit: totals.elevationGainMeters === null ? null : 'm',
      tone: 'violet',
      variation: null,
      series: null,
    },
    {
      id: 'heartRate',
      label: 'FC moyenne',
      value: formatInteger(averageHeartRate),
      unit: averageHeartRate === null ? null : 'bpm',
      tone: 'danger',
      variation: null,
      series: null,
    },
  ];
}

/** « 6h 42 », ou « 45 min » sous une heure. */
export function formatHoursMinutes(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return hours === 0 ? `${minutes} min` : `${hours}h ${String(minutes).padStart(2, '0')}`;
}

function formatInteger(value: number | null): string {
  return value === null ? ABSENT : INTEGER_FORMAT.format(value);
}

function toDurationVariation(
  variation: DashboardKpisResponseApi['variation'],
): VariationView | null {
  if (variation.direction === 'unknown' || variation.percent === null) {
    return null;
  }
  const sign =
    variation.direction === 'down' ? MINUS_SIGN : variation.direction === 'up' ? '+' : '';
  return {
    label: DIRECTION_LABELS[variation.direction],
    text: `${sign}${NUMBER_FORMAT.format(Math.abs(variation.percent))} %`,
    direction: variation.direction,
  };
}
