import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStoredCalendarMode, storeCalendarMode } from './calendar-mode';

afterEach(() => {
  sessionStorage.clear();
  vi.restoreAllMocks();
});

describe('calendar-mode', () => {
  it('reste en mode séances tant que rien n’est mémorisé', () => {
    expect(readStoredCalendarMode()).toBe('seances');
  });

  it('retrouve le mode alimentation mémorisé pour la session', () => {
    storeCalendarMode('alimentation');

    expect(readStoredCalendarMode()).toBe('alimentation');

    storeCalendarMode('seances');
    expect(readStoredCalendarMode()).toBe('seances');
  });

  it('ignore une valeur inconnue dans le stockage', () => {
    sessionStorage.setItem('sport-hub.calendrier.mode', 'n-importe-quoi');

    expect(readStoredCalendarMode()).toBe('seances');
  });

  it('ne plante pas quand le stockage est indisponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });

    expect(() => storeCalendarMode('alimentation')).not.toThrow();
    expect(readStoredCalendarMode()).toBe('seances');
  });
});
