import { describe, expect, it } from 'vitest';
import { dashboardKpisResponse } from '../../../../mocks/fixtures/dashboard-kpis.fixtures';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import { toPerformanceSeries } from './performance.mapper';

describe('toPerformanceSeries', () => {
  it('convertit les durées journalières en heures et garde un libellé par jour', () => {
    const series = toPerformanceSeries(dashboardKpisResponse);

    expect(series.labels).toHaveLength(7);
    expect(series.labels[0]).toBe('1 nov.');
    expect(series.hours.slice(0, 4)).toEqual([0, 0.75, 0, 1.33]);
  });

  it('repère le jour de durée maximale', () => {
    const series = toPerformanceSeries(dashboardKpisResponse);

    expect(series.maxIndex).toBe(6);
  });

  it('ne désigne aucun maximum quand la période est vide', () => {
    const api: DashboardKpisResponseApi = {
      ...dashboardKpisResponse,
      daily: dashboardKpisResponse.daily.map((day) => ({ ...day, count: 0, durationSeconds: 0 })),
    };

    const series = toPerformanceSeries(api);

    expect(series.maxIndex).toBeNull();
    expect(series.totalSeconds).toBe(0);
  });
});
