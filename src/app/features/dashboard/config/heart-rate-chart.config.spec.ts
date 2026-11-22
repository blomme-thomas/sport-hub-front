import { describe, expect, it } from 'vitest';
import type { HeartRateSampleApi } from '../models/recent-activity.api-model';
import { hasDistanceAxis, heartRateChartData } from './heart-rate-chart.config';

const START = '2026-11-15T10:00:00.000Z';

const samples: HeartRateSampleApi[] = [
  { occurredAt: '2026-11-15T10:00:00.000Z', bpm: 140 },
  { occurredAt: '2026-11-15T10:05:00.000Z', bpm: 150 },
  { occurredAt: '2026-11-15T10:12:30.000Z', bpm: 160 },
];

describe('heartRateChartData — axe horizontal', () => {
  it('place les échantillons par durée écoulée, en minutes', () => {
    const data = heartRateChartData(samples, null, START, 'time');

    expect(data.labels).toEqual(['0', '5', '13']);
  });

  it('garde les indices sans heure de départ (miniature)', () => {
    const data = heartRateChartData(samples, null);

    expect(data.labels).toEqual(['0', '1', '2']);
  });

  it('place les échantillons par distance en km quand l’axe km est demandé', () => {
    const withDistance = samples.map((sample, index) => ({
      ...sample,
      distanceMeters: index * 1500,
    }));

    const data = heartRateChartData(withDistance, null, START, 'distance');

    expect(data.labels).toEqual(['0.00', '1.50', '3.00']);
  });

  it('propose l’axe km seulement si chaque échantillon porte sa distance', () => {
    expect(hasDistanceAxis(samples)).toBe(false);
    expect(hasDistanceAxis(samples.map((sample) => ({ ...sample, distanceMeters: 0 })))).toBe(true);
    expect(
      hasDistanceAxis([...samples.slice(0, 2), { ...samples[2]!, distanceMeters: null }]),
    ).toBe(false);
  });
});
