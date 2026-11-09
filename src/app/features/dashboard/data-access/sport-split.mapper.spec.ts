import { describe, expect, it } from 'vitest';
import type { TypeVolumeApi } from '../models/training-stats.api-model';
import { toSportSplit } from './sport-split.mapper';

const formatTotal = (seconds: number) => `${Math.round(seconds / 3600)} h`;

function volume(family: TypeVolumeApi['family'], durationSeconds: number): TypeVolumeApi {
  return { type: family, family, count: 1, durationSeconds, distanceMeters: 0 };
}

describe('sport-split mapper', () => {
  it('répartit selon la famille fournie par le back, sans reclasser les types', () => {
    const split = toSportSplit(
      [volume('running', 3600), volume('cycling', 3600), volume('other', 3600)],
      formatTotal,
    );

    expect(split.shares.map((share) => share.family)).toEqual(['running', 'cycling', 'other']);
  });

  it('calcule des pourcentages entiers dont la somme vaut 100', () => {
    const split = toSportSplit(
      [volume('running', 100), volume('cycling', 100), volume('swimming', 100)],
      formatTotal,
    );

    const percents = split.shares.map((share) => share.percent);
    expect(percents.reduce((sum, value) => sum + value, 0)).toBe(100);
    expect(percents).toEqual([34, 33, 33]);
  });

  it('n’affiche pas une famille sans durée', () => {
    const split = toSportSplit([volume('running', 3600), volume('cycling', 0)], formatTotal);

    expect(split.shares.map((share) => share.label)).toEqual(['Course à pied']);
    expect(split.shares[0]?.percent).toBe(100);
  });

  it('renvoie une répartition vide sans durée enregistrée', () => {
    expect(toSportSplit([], formatTotal)).toEqual({ shares: [], totalLabel: '0 h' });
  });
});
