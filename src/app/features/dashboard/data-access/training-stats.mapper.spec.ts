import { describe, expect, it } from 'vitest';
import {
  emptyStatsResponse,
  normalStatsResponse,
} from '../../../../mocks/fixtures/training-stats.fixtures';
import { toDashboardView } from './training-stats.mapper';

const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/;

describe('toDashboardView', () => {
  it('reprend la granularité de la réponse', () => {
    expect(toDashboardView(normalStatsResponse).granularity).toBe('week');
  });

  it('expose le nombre de séances de la dernière période', () => {
    expect(toDashboardView(normalStatsResponse).currentPeriod.count).toBe(4);
  });

  it('convertit la durée de la dernière période de secondes en heures', () => {
    expect(toDashboardView(normalStatsResponse).currentPeriod.durationHours).toBe(2.5);
  });

  it('affiche la variation du nombre de séances avec son signe, son écart et son pourcentage', () => {
    const { text, direction } = toDashboardView(normalStatsResponse).variation.count;

    expect(text).toMatch(/^\+1\b/);
    expect(text).toContain('33');
    expect(direction).toBe('up');
  });

  it('convertit l écart de durée en heures avec son signe', () => {
    const { text, direction } = toDashboardView(normalStatsResponse).variation.duration;

    expect(text).toMatch(/^\+0[,.]5\b/);
    expect(direction).toBe('up');
  });

  it('affiche une variation négative avec un signe moins et le sens de la baisse', () => {
    const api = structuredClone(normalStatsResponse);
    api.periods[2].variation.totals.count = { absolute: -1, percent: -20 };

    const { text, direction } = toDashboardView(api).variation.count;

    expect(text).toMatch(/^[-−]1\b/);
    expect(direction).toBe('down');
  });

  it('affiche une variation nulle comme stable', () => {
    const api = structuredClone(normalStatsResponse);
    api.periods[2].variation.totals.count = { absolute: 0, percent: 0 };

    expect(toDashboardView(api).variation.count.direction).toBe('flat');
  });

  it('affiche n/a ou nouveau à la place du pourcentage quand il est null, sans NaN', () => {
    const api = structuredClone(normalStatsResponse);
    api.periods[2].variation.totals.count = { absolute: 4, percent: null };

    const view = toDashboardView(api);

    expect(view.variation.count.text).toMatch(/n\/a|nouveau/);
    expect(JSON.stringify(view)).not.toMatch(/NaN|undefined/);
  });

  it('trace le nombre de séances de chaque période dans l ordre chronologique', () => {
    const [series] = toDashboardView(normalStatsResponse).charts.sessions.series;

    expect(series?.values).toEqual([2, 3, 4]);
  });

  it('trace la durée de chaque période en heures', () => {
    const [series] = toDashboardView(normalStatsResponse).charts.duration.series;

    expect(series?.values).toEqual([1, 2, 2.5]);
  });

  it('attribue un libellé d axe distinct à chaque période', () => {
    const { labels } = toDashboardView(normalStatsResponse).charts.sessions;

    expect(labels).toHaveLength(3);
    expect(new Set(labels).size).toBe(3);
  });

  it('répartit la dernière période par type d activité, types triés', () => {
    const { labels, series } = toDashboardView(normalStatsResponse).charts.byType;

    expect(labels).toEqual(['cycling', 'running']);
    expect(series[0]?.values).toEqual([1, 3]);
  });

  it('affiche une répartition vide quand la dernière période ne contient aucun type', () => {
    const api = structuredClone(normalStatsResponse);
    api.periods[2].byType = [];

    const { labels, series } = toDashboardView(api).charts.byType;

    expect(labels).toEqual([]);
    expect(series[0]?.values).toEqual([]);
  });

  it('affiche zéro séance et zéro heure quand la dernière période est vide', () => {
    const view = toDashboardView(emptyStatsResponse);

    expect(view.currentPeriod.count).toBe(0);
    expect(view.currentPeriod.durationHours).toBe(0);
    expect(view.charts.byType.labels).toEqual([]);
  });

  it('ne lève pas d erreur et renvoie une vue sans période quand la réponse n en contient aucune', () => {
    const api = structuredClone(normalStatsResponse);
    api.periods = [];

    const view = toDashboardView(api);

    expect(view.currentPeriod.count).toBe(0);
    expect(view.charts.sessions.labels).toEqual([]);
  });

  it('décrit chaque graphique par un titre, des libellés, une unité et des séries à couleur CSS variable', () => {
    const { charts } = toDashboardView(normalStatsResponse);

    for (const chart of [charts.sessions, charts.duration, charts.byType]) {
      expect(Object.keys(chart).sort()).toEqual(['labels', 'series', 'title', 'unit']);
      expect(chart.title).not.toBe('');
      expect(chart.unit).not.toBe('');
      expect(chart.series.length).toBeGreaterThan(0);
      for (const series of chart.series) {
        expect(series.cssVar).toMatch(/^--sh-chart-series-\d+$/);
      }
    }
  });

  it('ne transmet aucune valeur hexadécimale dans la vue', () => {
    expect(JSON.stringify(toDashboardView(normalStatsResponse))).not.toMatch(HEX_COLOR);
  });
});
