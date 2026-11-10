import type {
  MetricVariationApi,
  PeriodStatsApi,
  TrainingStatsResponseApi,
} from '../models/training-stats.api-model';
import type {
  ChartModel,
  ChartSeries,
  DashboardView,
  Granularity,
  PeriodSummaryView,
  VariationDirection,
  VariationView,
} from '../models/training-stats.model';

const SECONDS_PER_HOUR = 3600;
const MILLISECONDS_PER_DAY = 86_400_000;
const MINUS_SIGN = '−';
const NOT_AVAILABLE = 'n/a';

const NUMBER_FORMAT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const MONTH_FORMAT = new Intl.DateTimeFormat('fr-FR', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const DIRECTION_LABELS: Record<VariationDirection, string> = {
  up: 'En hausse',
  down: 'En baisse',
  flat: 'Stable',
  unknown: 'Non comparable',
};

/**
 * Convertit la réponse de `GET /api/stats` en vue du tableau de bord : seules des conversions d'affichage
 * (secondes en heures, libellés d'axe, texte signé de la variation, `null` en « n/a »). Aucune statistique
 * n'est recalculée : les totaux et variations viennent du back. La dernière période de la réponse est la
 * période choisie ; les graphiques d'évolution couvrent toutes les périodes.
 */
export function toDashboardView(api: TrainingStatsResponseApi): Omit<DashboardView, 'period'> {
  const { granularity, periods } = api;
  const current = periods.at(-1);

  return {
    currentPeriod: summaryOf(current?.totals.count ?? 0, current?.totals.durationSeconds ?? 0),
    variation: {
      count: current
        ? variationView(current.variation.totals.count, formatSessions)
        : unavailableVariation(),
      duration: current
        ? variationView(current.variation.totals.durationSeconds, formatHours)
        : unavailableVariation(),
    },
    charts: {
      sessions: sessionsChart(granularity, periods),
      duration: durationChart(granularity, periods),
      byType: byTypeChart(current),
    },
  };
}

function summaryOf(count: number, durationSeconds: number): PeriodSummaryView {
  return {
    count,
    durationHours: roundHours(durationSeconds),
    countLabel: formatSessions(count),
    durationLabel: formatHours(durationSeconds),
  };
}

function sessionsChart(granularity: Granularity, periods: PeriodStatsApi[]): ChartModel {
  return {
    title: `Séances par ${unitWordOf(granularity)}`,
    labels: periodLabels(granularity, periods),
    series: [
      {
        label: 'Séances',
        values: periods.map((period) => period.totals.count),
        cssVar: '--sh-chart-series-1',
      },
    ],
    unit: 'séances',
  };
}

function durationChart(granularity: Granularity, periods: PeriodStatsApi[]): ChartModel {
  return {
    title: `Durée par ${unitWordOf(granularity)}`,
    labels: periodLabels(granularity, periods),
    series: [
      {
        label: 'Durée (h)',
        values: periods.map((period) => roundHours(period.totals.durationSeconds)),
        cssVar: '--sh-chart-series-2',
      },
    ],
    unit: 'h',
  };
}

function byTypeChart(current: PeriodStatsApi | undefined): ChartModel {
  const types = [...(current?.byType ?? [])].sort((a, b) => a.type.localeCompare(b.type));
  const series: ChartSeries = {
    label: 'Séances',
    values: types.map((item) => item.count),
    cssVar: '--sh-chart-series-1',
  };
  return {
    title: 'Répartition par type (dernière période)',
    labels: types.map((item) => item.type),
    series: [series],
    unit: 'séances',
  };
}

function variationView(
  metric: MetricVariationApi,
  formatAbsolute: (value: number) => string,
): VariationView {
  const signedAbsolute = `${signOf(metric.absolute)}${formatAbsolute(Math.abs(metric.absolute))}`;

  if (metric.percent === null) {
    return {
      label: DIRECTION_LABELS.unknown,
      text: `${signedAbsolute} (${NOT_AVAILABLE})`,
      direction: 'unknown',
    };
  }

  const direction = directionOf(metric.absolute);
  const percent = `${signOf(metric.percent)}${NUMBER_FORMAT.format(Math.abs(metric.percent))} %`;
  return {
    label: DIRECTION_LABELS[direction],
    text: `${signedAbsolute} (${percent})`,
    direction,
  };
}

function unavailableVariation(): VariationView {
  return { label: DIRECTION_LABELS.unknown, text: NOT_AVAILABLE, direction: 'unknown' };
}

function directionOf(absolute: number): VariationDirection {
  if (absolute > 0) {
    return 'up';
  }
  return absolute < 0 ? 'down' : 'flat';
}

function signOf(value: number): string {
  if (value > 0) {
    return '+';
  }
  return value < 0 ? MINUS_SIGN : '';
}

function formatSessions(count: number): string {
  return `${NUMBER_FORMAT.format(count)} ${count === 1 ? 'séance' : 'séances'}`;
}

/** Durée en heures à une décimale près, « 6,7 h » : utilisée aussi par la carte Répartition par sport. */
export function formatHours(durationSeconds: number): string {
  return `${NUMBER_FORMAT.format(durationSeconds / SECONDS_PER_HOUR)} h`;
}

function roundHours(durationSeconds: number): number {
  return Math.round(durationSeconds / 36) / 100;
}

function unitWordOf(granularity: Granularity): string {
  return granularity === 'week' ? 'semaine' : 'mois';
}

function periodLabels(granularity: Granularity, periods: PeriodStatsApi[]): string[] {
  return periods.map((period) =>
    granularity === 'week'
      ? `S${isoWeekOf(period.start)}`
      : MONTH_FORMAT.format(new Date(period.start)),
  );
}

function isoWeekOf(start: string): number {
  const date = new Date(start);
  const isoWeekday = date.getUTCDay() || 7;
  const thursday = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 4 - isoWeekday),
  );
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1);
  return Math.ceil(((thursday.getTime() - yearStart) / MILLISECONDS_PER_DAY + 1) / 7);
}
