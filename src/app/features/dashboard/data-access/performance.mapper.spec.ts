import { describe, expect, it } from 'vitest';
import { dashboardKpisResponse } from '../../../../mocks/fixtures/dashboard-kpis.fixtures';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import {
  formatHoursMinutesLong,
  toPerformanceSeries,
  toPerformanceTable,
} from './performance.mapper';

describe('toPerformanceSeries', () => {
  it('convertit les durées journalières en heures et garde un libellé par jour', () => {
    const series = toPerformanceSeries(dashboardKpisResponse);

    expect(series.labels).toHaveLength(7);
    expect(series.labels[0]).toBe('1 nov.');
    expect(series.hours.slice(0, 4)).toEqual([0, 0.75, 0, 1.33]);
  });

  it('repère le jour de durée maximale et le décrit', () => {
    const series = toPerformanceSeries(dashboardKpisResponse);

    expect(series.maxIndex).toBe(6);
    expect(series.maxLabel).toBe('3h 37min le 7 nov.');
  });

  it('ne désigne aucun maximum quand la période est vide', () => {
    const api: DashboardKpisResponseApi = {
      ...dashboardKpisResponse,
      daily: dashboardKpisResponse.daily.map((day) => ({ ...day, count: 0, durationSeconds: 0 })),
    };

    const series = toPerformanceSeries(api);

    expect(series.maxIndex).toBeNull();
    expect(series.maxLabel).toBeNull();
    expect(series.totalSeconds).toBe(0);
  });
});

describe('toPerformanceTable', () => {
  it('produit une ligne par jour pour le tableau accessible', () => {
    const table = toPerformanceTable(toPerformanceSeries(dashboardKpisResponse));

    expect(table.labels).toHaveLength(7);
    expect(table.series[0]?.values).toHaveLength(7);
    expect(table.unit).toBe('h');
  });
});

describe('formatHoursMinutesLong', () => {
  it('affiche « 3h 12min » et « 45min » sous une heure', () => {
    expect(formatHoursMinutesLong(11520)).toBe('3h 12min');
    expect(formatHoursMinutesLong(2700)).toBe('45min');
  });
});
