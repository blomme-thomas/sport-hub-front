import { describe, expect, it } from 'vitest';
import { zoneOf } from './heart-rate-zones.model';

const FLOORS = [102, 122, 143, 163, 184] as const;

describe('zoneOf', () => {
  it('range une fréquence cardiaque dans sa zone à partir des bornes basses', () => {
    expect(zoneOf(110, FLOORS)).toBe(1);
    expect(zoneOf(122, FLOORS)).toBe(2);
    expect(zoneOf(150, FLOORS)).toBe(3);
    expect(zoneOf(170, FLOORS)).toBe(4);
    expect(zoneOf(190, FLOORS)).toBe(5);
  });

  it('retient la zone 1 en dessous de la borne basse, et rien sans bornes', () => {
    expect(zoneOf(80, FLOORS)).toBe(1);
    expect(zoneOf(150, null)).toBeNull();
  });
});
