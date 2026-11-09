export type Granularity = 'week' | 'month';

/** Période du tableau de bord, choisie dans le sélecteur de l'en-tête. */
export const DASHBOARD_PERIODS = ['7d', '30d', '3m'] as const;
export type DashboardPeriod = (typeof DASHBOARD_PERIODS)[number];

/** Granularité des statistiques (graphiques) pour une période : semaines pour 7 et 30 jours, mois pour 3 mois. */
export function granularityOf(period: DashboardPeriod): Granularity {
  return period === '3m' ? 'month' : 'week';
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

import type { SportSplitView } from './sport-split.model';

export interface DashboardView {
  period: DashboardPeriod;
  currentPeriod: PeriodSummaryView;
  variation: {
    count: VariationView;
    duration: VariationView;
  };
  charts: Record<ChartKey, ChartModel>;
  /** Répartition par sport de la dernière période (carte Répartition par sport). */
  sportSplit: SportSplitView;
}
