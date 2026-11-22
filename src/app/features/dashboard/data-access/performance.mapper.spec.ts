import { describe, expect, it } from 'vitest';
import { dashboardKpisResponse } from '../../../../mocks/fixtures/dashboard-kpis.fixtures';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import { toPerformanceSeries } from './performance.mapper';

describe('toPerformanceSeries', () => {
  it('convertit les durées journalières en heures et garde un libellé par jour', () => {
    const series = toPerformanceSeries(dashboardKpisResponse);

    expect(series.labels).toHaveLength(7);
    expect(series.labels[0]).toBe('Dim');
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

describe('toWeeklySeries', () => {
  it('regroupe les jours par semaine ISO sans perdre de durée', async () => {
    const { toWeeklySeries, toPerformanceSeries } = await import('./performance.mapper');

    const weekly = toWeeklySeries(dashboardKpisResponse);
    const daily = toPerformanceSeries(dashboardKpisResponse);

    expect(weekly.labels.length).toBeGreaterThan(0);
    expect(weekly.labels.length).toBeLessThanOrEqual(daily.labels.length);
    expect(weekly.labels.every((label) => /^S\d{2}$/.test(label))).toBe(true);
    expect(weekly.totalSeconds).toBe(daily.totalSeconds);
    expect(weekly.hours.reduce((sum, hours) => sum + hours, 0)).toBeCloseTo(
      daily.hours.reduce((sum, hours) => sum + hours, 0),
      1,
    );
  });
});
