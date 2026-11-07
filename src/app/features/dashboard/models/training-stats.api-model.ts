export interface VolumeApi {
  count: number;
  durationSeconds: number;
  distanceMeters: number;
}

export interface TypeVolumeApi extends VolumeApi {
  type: string;
}

export interface MetricVariationApi {
  absolute: number;
  percent: number | null;
}

export interface VolumeVariationApi {
  count: MetricVariationApi;
  durationSeconds: MetricVariationApi;
  distanceMeters: MetricVariationApi;
}

export interface TypeVolumeVariationApi extends VolumeVariationApi {
  type: string;
}

export interface PreviousPeriodStatsApi {
  start: string;
  end: string;
  totals: VolumeApi;
  byType: TypeVolumeApi[];
}

export interface PeriodStatsApi {
  start: string;
  end: string;
  totals: VolumeApi;
  byType: TypeVolumeApi[];
  previous: PreviousPeriodStatsApi;
  variation: {
    totals: VolumeVariationApi;
    byType: TypeVolumeVariationApi[];
  };
}

export interface TrainingStatsResponseApi {
  granularity: 'week' | 'month';
  from: string;
  to: string;
  type: string | null;
  periods: PeriodStatsApi[];
}
