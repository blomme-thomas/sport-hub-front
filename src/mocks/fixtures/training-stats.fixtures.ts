import type {
  MetricVariationApi,
  PeriodStatsApi,
  TrainingStatsResponseApi,
  TypeVolumeApi,
  VolumeApi,
} from '../../app/features/dashboard/models/training-stats.api-model';

interface PreviousInput {
  start: string;
  end: string;
  totals: VolumeApi;
  byType?: TypeVolumeApi[];
}

interface PeriodInput {
  start: string;
  end: string;
  totals: VolumeApi;
  byType?: TypeVolumeApi[];
  previous: PreviousInput;
}

export function volume(count: number, durationSeconds: number, distanceMeters: number): VolumeApi {
  return { count, durationSeconds, distanceMeters };
}

export function typeVolume(
  type: string,
  count: number,
  durationSeconds: number,
  distanceMeters: number,
): TypeVolumeApi {
  return { type, family: familyFixtureOf(type), count, durationSeconds, distanceMeters };
}

/** Famille calculée par le back, reproduite pour les fixtures (course, vélo, natation, autre). */
function familyFixtureOf(type: string): TypeVolumeApi['family'] {
  if (['running', 'trail_running', 'treadmill_running', 'track_running'].includes(type))
    return 'running';
  if (
    [
      'cycling',
      'indoor_cycling',
      'road_biking',
      'virtual_ride',
      'gravel_cycling',
      'mountain_biking',
      'e_bike_fitness',
    ].includes(type)
  )
    return 'cycling';
  if (['swimming', 'lap_swimming', 'open_water_swimming'].includes(type)) return 'swimming';
  return 'other';
}

function metric(current: number, previous: number): MetricVariationApi {
  const absolute = current - previous;
  return {
    absolute,
    percent: previous === 0 ? null : Math.round((absolute / previous) * 1000) / 10,
  };
}

function variationOf(current: VolumeApi, previous: VolumeApi) {
  return {
    count: metric(current.count, previous.count),
    durationSeconds: metric(current.durationSeconds, previous.durationSeconds),
    distanceMeters: metric(current.distanceMeters, previous.distanceMeters),
  };
}

function typeVariationsOf(byType: TypeVolumeApi[], previousByType: TypeVolumeApi[]) {
  return byType.map((item) => {
    const previous =
      previousByType.find((candidate) => candidate.type === item.type) ?? volume(0, 0, 0);
    return { type: item.type, ...variationOf(item, previous) };
  });
}

function periodOf(input: PeriodInput): PeriodStatsApi {
  const byType = input.byType ?? [];
  const previousByType = input.previous.byType ?? [];
  return {
    start: input.start,
    end: input.end,
    totals: input.totals,
    byType,
    previous: {
      start: input.previous.start,
      end: input.previous.end,
      totals: input.previous.totals,
      byType: previousByType,
    },
    variation: {
      totals: variationOf(input.totals, input.previous.totals),
      byType: typeVariationsOf(byType, previousByType),
    },
  };
}

export const normalStatsResponse: TrainingStatsResponseApi = {
  granularity: 'week',
  from: '2026-10-19',
  to: '2026-11-08',
  type: null,
  periods: [
    periodOf({
      start: '2026-10-19T00:00:00.000Z',
      end: '2026-10-25T23:59:59.999Z',
      totals: volume(2, 3600, 20000),
      byType: [typeVolume('running', 2, 3600, 20000)],
      previous: {
        start: '2026-10-12T00:00:00.000Z',
        end: '2026-10-18T23:59:59.999Z',
        totals: volume(1, 1800, 5000),
        byType: [typeVolume('running', 1, 1800, 5000)],
      },
    }),
    periodOf({
      start: '2026-10-26T00:00:00.000Z',
      end: '2026-11-01T23:59:59.999Z',
      totals: volume(3, 7200, 30000),
      byType: [typeVolume('cycling', 1, 2400, 10000), typeVolume('running', 2, 4800, 20000)],
      previous: {
        start: '2026-10-19T00:00:00.000Z',
        end: '2026-10-25T23:59:59.999Z',
        totals: volume(2, 3600, 20000),
        byType: [typeVolume('running', 2, 3600, 20000)],
      },
    }),
    periodOf({
      start: '2026-11-02T00:00:00.000Z',
      end: '2026-11-08T23:59:59.999Z',
      totals: volume(4, 9000, 42000),
      byType: [typeVolume('cycling', 1, 3000, 12000), typeVolume('running', 3, 6000, 30000)],
      previous: {
        start: '2026-10-26T00:00:00.000Z',
        end: '2026-11-01T23:59:59.999Z',
        totals: volume(3, 7200, 30000),
        byType: [typeVolume('cycling', 1, 2400, 10000), typeVolume('running', 2, 4800, 20000)],
      },
    }),
  ],
};

export const emptyStatsResponse: TrainingStatsResponseApi = {
  ...normalStatsResponse,
  periods: normalStatsResponse.periods.map((period) =>
    periodOf({
      start: period.start,
      end: period.end,
      totals: volume(0, 0, 0),
      previous: {
        start: period.previous.start,
        end: period.previous.end,
        totals: volume(0, 0, 0),
      },
    }),
  ),
};

export const monthStatsResponse: TrainingStatsResponseApi = {
  granularity: 'month',
  from: '2026-10-01',
  to: '2026-11-30',
  type: null,
  periods: [
    periodOf({
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-10-31T23:59:59.999Z',
      totals: volume(10, 36000, 150000),
      byType: [typeVolume('running', 10, 36000, 150000)],
      previous: {
        start: '2026-09-01T00:00:00.000Z',
        end: '2026-09-30T23:59:59.999Z',
        totals: volume(8, 28800, 120000),
        byType: [typeVolume('running', 8, 28800, 120000)],
      },
    }),
    periodOf({
      start: '2026-11-01T00:00:00.000Z',
      end: '2026-11-30T23:59:59.999Z',
      totals: volume(4, 9000, 42000),
      byType: [typeVolume('cycling', 1, 3000, 12000), typeVolume('running', 3, 6000, 30000)],
      previous: {
        start: '2026-10-01T00:00:00.000Z',
        end: '2026-10-31T23:59:59.999Z',
        totals: volume(10, 36000, 150000),
        byType: [typeVolume('running', 10, 36000, 150000)],
      },
    }),
  ],
};
