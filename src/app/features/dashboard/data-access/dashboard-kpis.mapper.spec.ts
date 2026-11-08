import { describe, expect, it } from 'vitest';
import { dashboardKpisResponse } from '../../../../mocks/fixtures/dashboard-kpis.fixtures';
import type { DashboardKpisResponseApi } from '../models/dashboard-kpis.api-model';
import { formatHoursMinutes, toDashboardKpis } from './dashboard-kpis.mapper';

// Espaces de séparation des milliers en fr-FR (espace fine insécable), écrits en échappement pour rester visibles.
const THOUSANDS_SPACE = ' ';

describe('formatHoursMinutes', () => {
  it('affiche heures et minutes sur deux chiffres', () => {
    expect(formatHoursMinutes(24120)).toBe('6h 42');
    expect(formatHoursMinutes(3660)).toBe('1h 01');
  });

  it('affiche les minutes seules sous une heure', () => {
    expect(formatHoursMinutes(2700)).toBe('45 min');
  });
});

describe('toDashboardKpis', () => {
  it('produit les cinq indicateurs dans l ordre du bandeau', () => {
    const kpis = toDashboardKpis(dashboardKpisResponse);

    expect(kpis.map((kpi) => kpi.label)).toEqual([
      'Séances',
      'Durée totale',
      'Calories brûlées',
      'Dénivelé positif',
      'FC moyenne',
    ]);
    expect(kpis.map((kpi) => [kpi.value, kpi.unit])).toEqual([
      ['5', null],
      ['6h 42', null],
      [`4${THOUSANDS_SPACE}920`, 'kcal'],
      ['435', 'm'],
      ['142', 'bpm'],
    ]);
  });

  it('n affiche une variation et une série que pour la durée et les séances', () => {
    const [sessions, duration, calories, elevation, heartRate] =
      toDashboardKpis(dashboardKpisResponse);

    expect(duration?.variation).toEqual({ label: 'En hausse', text: '+12,5 %', direction: 'up' });
    expect(sessions?.variation).toBeNull();
    expect(calories?.series).toHaveLength(7);
    expect(elevation?.series).toBeNull();
    expect(heartRate?.series).toBeNull();
  });

  it('affiche un tiret quand une valeur est absente, sans variation inventée', () => {
    const api: DashboardKpisResponseApi = {
      ...dashboardKpisResponse,
      totals: { ...dashboardKpisResponse.totals, calories: null, elevationGainMeters: null },
      averageHeartRate: null,
      variation: { direction: 'unknown', percent: null },
    };

    const [, duration, calories, elevation, heartRate] = toDashboardKpis(api);

    expect(calories).toMatchObject({ value: '—', unit: null });
    expect(elevation).toMatchObject({ value: '—', unit: null });
    expect(heartRate).toMatchObject({ value: '—', unit: null });
    expect(duration?.variation).toBeNull();
  });

  it('signe la baisse avec un moins typographique', () => {
    const api: DashboardKpisResponseApi = {
      ...dashboardKpisResponse,
      variation: { direction: 'down', percent: 20 },
    };

    expect(toDashboardKpis(api)[1]?.variation?.text).toBe('−20 %');
  });
});
