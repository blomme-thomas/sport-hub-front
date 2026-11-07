export type Granularity = 'week' | 'month';

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
  granularity: Granularity;
  currentPeriod: PeriodSummaryView;
  variation: {
    count: VariationView;
    duration: VariationView;
  };
  charts: Record<ChartKey, ChartModel>;
}
