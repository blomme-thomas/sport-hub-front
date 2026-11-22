import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import type { DashboardKpi } from '../models/dashboard-kpi.model';
import type { SportSplitView } from '../models/sport-split.model';
import type { VariationDirection, VariationView } from '../models/training-stats.model';
import { toSportSplit } from './sport-split.mapper';
import { formatHours } from './training-stats.mapper';
import { fill, TEXTS } from '@shared/texts/texts';

const ABSENT = '—';
const DAY_LABEL = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const MINUS_SIGN = '−';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const INTEGER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

const DIRECTION_LABELS: Record<VariationDirection, string> = {
  up: TEXTS.dashboard.variation.up,
  down: TEXTS.dashboard.variation.down,
  flat: TEXTS.dashboard.variation.flat,
  unknown: TEXTS.dashboard.variation.unknown,
};

/** Convertit la réponse du back en cinq indicateurs d'affichage, dans l'ordre du bandeau. */
export function toDashboardKpis(api: DashboardKpisResponseApi): DashboardKpi[] {
  const { totals, averageHeartRate, daily } = api;
  return [
    {
      id: 'sessions',
      label: TEXTS.dashboard.kpi.sessions,
      value: INTEGER_FORMAT.format(totals.count),
      unit: null,
      tone: 'accent',
      variation: null,
      series: daily.map((day) => day.count),
      seriesLabels: dayLabelsOf(daily),
    },
    {
      id: 'duration',
      label: TEXTS.dashboard.kpi.duration,
      value: formatHoursMinutes(totals.durationSeconds),
      unit: null,
      tone: 'success',
      variation: toDurationVariation(api.variation),
      series: daily.map((day) => day.durationSeconds / SECONDS_PER_HOUR),
      seriesLabels: dayLabelsOf(daily),
    },
    {
      id: 'calories',
      label: TEXTS.dashboard.kpi.calories,
      value: formatInteger(totals.calories),
      unit: totals.calories === null ? null : 'kcal',
      tone: 'orange',
      variation: null,
      series: daily.map((day) => day.calories),
      seriesLabels: dayLabelsOf(daily),
    },
    {
      id: 'elevation',
      label: TEXTS.dashboard.kpi.elevation,
      value: formatInteger(totals.elevationGainMeters),
      unit: totals.elevationGainMeters === null ? null : 'm',
      tone: 'violet',
      variation: null,
      series: null,
    },
    {
      id: 'heartRate',
      label: TEXTS.dashboard.kpi.heartRate,
      value: formatInteger(averageHeartRate),
      unit: averageHeartRate === null ? null : 'bpm',
      tone: 'danger',
      variation: null,
      series: null,
    },
  ];
}

/** Répartition par sport de la période choisie, à partir de `bySport` (carte Répartition par sport). */
export function toSportSplitView(api: DashboardKpisResponseApi): SportSplitView {
  return toSportSplit(api.bySport, formatHours);
}

/** « 6h 42 », ou « 45 min » sous une heure. */
export function formatHoursMinutes(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return hours === 0
    ? fill(TEXTS.dashboard.detail.minutes, { value: minutes })
    : fill(TEXTS.dashboard.detail.hoursMinutes, {
        hours,
        minutes: String(minutes).padStart(2, '0'),
      });
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

/** Libellés « 3 nov. » des jours d’une série journalière, dans l’ordre de la série. */
function dayLabelsOf(daily: { date: string }[]): string[] {
  return daily.map((day) => DAY_LABEL.format(new Date(`${day.date}T00:00:00Z`)));
}
