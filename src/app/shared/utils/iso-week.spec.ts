import { describe, expect, it } from 'vitest';
import { isoWeekOf, mondayOfIsoWeek, shiftIsoWeek } from './iso-week';

describe('iso-week', () => {
  it('donne la semaine ISO d’une date', () => {
    expect(isoWeekOf('2026-11-09')).toBe('2026-W46');
    expect(isoWeekOf('2026-11-15')).toBe('2026-W46');
    expect(isoWeekOf('2026-11-16')).toBe('2026-W47');
  });

  it('rattache les derniers jours de décembre à la semaine 1 de l’année suivante', () => {
    expect(isoWeekOf('2025-12-29')).toBe('2026-W01');
    expect(isoWeekOf('2025-12-31')).toBe('2026-W01');
  });

  it('rattache les premiers jours de janvier à la semaine 53 de l’année précédente', () => {
    expect(isoWeekOf('2027-01-01')).toBe('2026-W53');
  });

  it('donne le lundi de la semaine', () => {
    expect(mondayOfIsoWeek('2026-W46')).toBe('2026-11-09');
    expect(mondayOfIsoWeek('2026-W01')).toBe('2025-12-29');
  });

  it('décale d’une ou plusieurs semaines, y compris à travers une fin d’année', () => {
    expect(shiftIsoWeek('2026-W46', 1)).toBe('2026-W47');
    expect(shiftIsoWeek('2026-W46', -1)).toBe('2026-W45');
    expect(shiftIsoWeek('2026-W52', 2)).toBe('2027-W01');
    expect(shiftIsoWeek('2026-W01', -1)).toBe('2025-W52');
  });

  it('refuse un format de semaine invalide', () => {
    expect(() => mondayOfIsoWeek('2026-11-09')).toThrow('Semaine ISO invalide');
  });
});
