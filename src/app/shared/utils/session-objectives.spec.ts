import { describe, expect, it } from 'vitest';
import { displayedRate, formatZoneGap, validateObjectives } from './session-objectives';

describe('validateObjectives', () => {
  it('accepte une répartition qui totalise 100 % sans distance', () => {
    expect(
      validateObjectives({ distanceMeters: null, zonePercentages: [10, 20, 40, 20, 10] }),
    ).toEqual({});
  });

  it('accepte une distance positive', () => {
    expect(
      validateObjectives({ distanceMeters: 10000, zonePercentages: [0, 0, 100, 0, 0] }),
    ).toEqual({});
  });

  it('refuse une distance nulle ou négative', () => {
    expect(
      validateObjectives({ distanceMeters: 0, zonePercentages: [0, 0, 100, 0, 0] }).distance,
    ).toBeDefined();
    expect(
      validateObjectives({ distanceMeters: -5, zonePercentages: [0, 0, 100, 0, 0] }).distance,
    ).toBeDefined();
  });

  it('refuse une répartition qui ne totalise pas 100 %, en indiquant le total', () => {
    const errors = validateObjectives({
      distanceMeters: null,
      zonePercentages: [10, 20, 40, 20, 5],
    });

    expect(errors.zonesTotal).toBe('La répartition doit totaliser 100 % (actuellement 95 %).');
  });

  it('refuse une répartition incomplète', () => {
    expect(
      validateObjectives({ distanceMeters: null, zonePercentages: [50, null, 50, 0, 0] }).zones,
    ).toBeDefined();
  });
});

describe('displayedRate', () => {
  it('plafonne le taux à 100 %', () => {
    expect(displayedRate(120)).toBe(100);
  });

  it('garde un taux inférieur tel quel et renvoie null sans donnée', () => {
    expect(displayedRate(83.3)).toBe(83.3);
    expect(displayedRate(null)).toBeNull();
  });
});

describe('formatZoneGap', () => {
  it('signe l’écart en points, au singulier pour un point', () => {
    expect(formatZoneGap(5)).toBe('+5 pts');
    expect(formatZoneGap(-5)).toBe('−5 pts');
    expect(formatZoneGap(1)).toBe('+1 pt');
    expect(formatZoneGap(0)).toBe('0 pt');
  });
});
