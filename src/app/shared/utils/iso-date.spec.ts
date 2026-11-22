import { describe, expect, it } from 'vitest';
import { addIsoDays, dateToIsoDate, isoDateToDate, localIsoDate } from './iso-date';

describe('iso-date', () => {
  it('formate une date locale en YYYY-MM-DD, sans décalage UTC', () => {
    expect(localIsoDate(new Date(2026, 10, 9, 0, 30))).toBe('2026-11-09');
  });

  it('aller-retour entre chaîne ISO et Date locale', () => {
    expect(dateToIsoDate(isoDateToDate('2026-02-28'))).toBe('2026-02-28');
    expect(isoDateToDate(null)).toBeNull();
    expect(dateToIsoDate(null)).toBeNull();
  });

  it('ajoute des jours calendaires, y compris à travers un changement de mois ou d’année', () => {
    expect(addIsoDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addIsoDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addIsoDays('2026-11-09', -7)).toBe('2026-11-02');
  });
});
