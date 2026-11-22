import { describe, expect, it } from 'vitest';
import { toHoursMinutes, toTotalSeconds } from './weekly-target.format';

describe('weekly-target.format', () => {
  it('découpe une durée en heures et minutes, les secondes étant ignorées', () => {
    expect(toHoursMinutes(24120)).toEqual({ hours: 6, minutes: 42 });
    expect(toHoursMinutes(28859)).toEqual({ hours: 8, minutes: 0 });
    expect(toHoursMinutes(0)).toEqual({ hours: 0, minutes: 0 });
  });

  it('convertit heures et minutes saisies en secondes totales', () => {
    expect(toTotalSeconds({ hours: 8, minutes: 0 })).toBe(28800);
    expect(toTotalSeconds({ hours: 0, minutes: 45 })).toBe(2700);
  });

  it('se reconvertit à l’identique', () => {
    expect(toTotalSeconds(toHoursMinutes(28800))).toBe(28800);
  });
});
