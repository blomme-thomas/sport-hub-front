import { describe, expect, it } from 'vitest';
import type { TypeVolumeApi } from '../models/training-stats.api-model';
import { familyOf, toSportSplit } from './sport-split.mapper';

const formatTotal = (seconds: number) => `${Math.round(seconds / 3600)} h`;

function volume(type: string, durationSeconds: number): TypeVolumeApi {
  return { type, count: 1, durationSeconds, distanceMeters: 0 } as unknown as TypeVolumeApi;
}

describe('sport-split mapper', () => {
  it('regroupe les types Garmin par famille de sport', () => {
    expect(familyOf('running')).toBe('running');
    expect(familyOf('indoor_cycling')).toBe('cycling');
    expect(familyOf('lap_swimming')).toBe('swimming');
    expect(familyOf('strength_training')).toBe('other');
  });

  it('classe les variantes de course, vélo et natation dans leur sport', () => {
    expect(familyOf('track_running')).toBe('running');
    expect(familyOf('road_biking')).toBe('cycling');
    expect(familyOf('e_bike_fitness')).toBe('cycling');
    expect(familyOf('open_water_swimming')).toBe('swimming');
  });

  it('range tout type inconnu dans « autres »', () => {
    expect(familyOf('hiking')).toBe('other');
    expect(familyOf('walking')).toBe('other');
    expect(familyOf('yoga')).toBe('other');
  });

  it('calcule des pourcentages entiers dont la somme vaut 100', () => {
    const split = toSportSplit(
      [volume('running', 100), volume('cycling', 100), volume('lap_swimming', 100)],
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
