export type Granularity = 'week' | 'month';

/** Période du tableau de bord, choisie dans le sélecteur de l'en-tête : la semaine ou le mois civil en cours. */
export const DASHBOARD_PERIODS = ['week', 'month'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** Granularité des statistiques (graphiques) pour une période : la même que la période (semaine ou mois). */
export function granularityOf(period: DashboardPeriod): Granularity {
  return period;
}

export type ChartKey = 'sessions' | 'duration' | 'byType';

export interface ChartSeries {
  label: string;
  values: (number | null)[];
  cssVar: string;
}

export interface ChartModel {
  title: string;
  labels: string[];
  series: ChartSeries[];
  unit: string;
}

export type VariationDirection = 'up' | 'down' | 'flat' | 'unknown';

export interface VariationView {
  label: string;
  text: string;
  direction: VariationDirection;
}

export interface PeriodSummaryView {
  count: number;
  durationHours: number;
  countLabel: string;
  durationLabel: string;
}

export interface DashboardView {
  period: DashboardPeriod;
  currentPeriod: PeriodSummaryView;
  variation: {
    count: VariationView;
    duration: VariationView;
  };
  charts: Record<ChartKey, ChartModel>;
}
