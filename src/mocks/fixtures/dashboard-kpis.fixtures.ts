import type { DashboardKpisResponseApi } from '../../app/features/dashboard/models/dashboard-kpis.api-model';

/** Indicateurs sur 7 jours, avec une série journalière complète (jours vides compris). */
export const dashboardKpisResponse: DashboardKpisResponseApi = {
  period: '7d',
  from: '2026-11-01',
  to: '2026-11-07',
  totals: {
    count: 5,
    durationSeconds: 24120,
    calories: 4920,
    elevationGainMeters: 435,
  },
  averageHeartRate: 142,
  daily: [
    { date: '2026-11-01', count: 0, durationSeconds: 0, calories: null },
    { date: '2026-11-02', count: 1, durationSeconds: 2700, calories: 600 },
    { date: '2026-11-03', count: 0, durationSeconds: 0, calories: null },
    { date: '2026-11-04', count: 1, durationSeconds: 4800, calories: 1100 },
    { date: '2026-11-05', count: 1, durationSeconds: 3600, calories: 820 },
    { date: '2026-11-06', count: 0, durationSeconds: 0, calories: null },
    { date: '2026-11-07', count: 2, durationSeconds: 13020, calories: 2400 },
  ],
  variation: { direction: 'up', percent: 12.5 },
};
