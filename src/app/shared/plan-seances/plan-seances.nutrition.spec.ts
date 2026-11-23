import { describe, expect, it } from 'vitest';
import { countSessions, parseSingleSession, toPrefill } from './plan-seances.parser';

const MODULE = {
  type: 'echauffement',
  durationMinutes: 10,
  instruction: 'Footing souple',
  targetZones: null,
  perceivedEffort: null,
};

function plan(version: number, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    kind: 'plan-seances',
    schemaVersion: version,
    seances: [
      {
        date: '2026-11-12',
        disciplineTypeKey: 'course_a_pied',
        durationMinutes: 45,
        startTime: '18:00',
        modules: [MODULE],
        ...extra,
      },
    ],
  });
}

describe('plan-seances : glucides et hydratation (version 2)', () => {
  it('accepte une version 2 et lit les champs de nutrition', () => {
    const result = parseSingleSession(
      plan(2, { carbsGrams: 60, carbsUnit: 'par_heure', hydrationMilliliters: 750 }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seance).toMatchObject({
        carbsGrams: 60,
        carbsUnit: 'par_heure',
        hydrationMilliliters: 750,
      });
    }
  });

  it('accepte encore une version 1, sans nutrition', () => {
    const result = parseSingleSession(plan(1));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.seance).not.toHaveProperty('carbsGrams');
    }
  });

  it('refuse les champs de nutrition dans une version 1', () => {
    const result = parseSingleSession(plan(1, { hydrationMilliliters: 750 }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toContain('seances[0].hydrationMilliliters');
    }
  });

  it('refuse une version inconnue', () => {
    const result = parseSingleSession(plan(3));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toContain('schemaVersion');
    }
  });

  it('borne les glucides et l’hydratation comme le back', () => {
    const result = parseSingleSession(
      plan(2, { carbsGrams: 1001, carbsUnit: 'par_heure', hydrationMilliliters: 0 }),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      const paths = result.issues.map((issue) => issue.path);
      expect(paths).toContain('seances[0].carbsGrams');
      expect(paths).toContain('seances[0].hydrationMilliliters');
    }
  });

  it('exige les glucides et leur unité ensemble', () => {
    const result = parseSingleSession(plan(2, { carbsGrams: 60 }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        { path: 'seances[0].carbsUnit', message: 'Les glucides et leur unité vont ensemble.' },
      ]);
    }
  });

  it('refuse une unité de glucides inconnue', () => {
    const result = parseSingleSession(plan(2, { carbsGrams: 60, carbsUnit: 'par_jour' }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toContain('seances[0].carbsUnit');
    }
  });

  it('reprend la nutrition dans le pré-remplissage, null compris quand le fichier la déclare', () => {
    const result = parseSingleSession(
      plan(2, { carbsGrams: null, carbsUnit: null, hydrationMilliliters: 500 }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(toPrefill(result.seance)).toMatchObject({
        carbsGrams: null,
        carbsUnit: null,
        hydrationMilliliters: 500,
      });
    }
  });

  it('compte les séances d’un fichier version 2 pour l’import en lot', () => {
    const result = countSessions(plan(2, { carbsGrams: 60, carbsUnit: 'par_heure' }));

    expect(result).toMatchObject({ ok: true, count: 1 });
  });
});
