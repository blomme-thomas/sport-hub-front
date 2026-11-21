import { describe, expect, it } from 'vitest';
import { countSessions, parseSingleSession, toPrefill } from './plan-seances.parser';
import type { PlanSeance, PlanSeanceModule } from './plan-seances.model';

const MODULE: PlanSeanceModule = {
  type: 'series',
  durationMinutes: 25,
  instruction: '4 x 400 m',
  targetZones: { heartRate: { min: 160, max: 170 } },
  perceivedEffort: 7,
};

const SEANCE: PlanSeance = {
  date: '2026-11-20',
  disciplineTypeKey: 'running',
  durationMinutes: 45,
  startTime: '18:00',
  description: 'Fond',
  modules: [
    {
      type: 'echauffement',
      durationMinutes: 10,
      instruction: 'Footing',
      targetZones: null,
      perceivedEffort: null,
    },
    MODULE,
  ],
};

function file(seances: unknown[]): string {
  return JSON.stringify({
    kind: 'plan-seances',
    schemaVersion: 1,
    importId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    seances,
  });
}

describe('parseSingleSession', () => {
  it('accepte un fichier d’une seule séance valide', () => {
    const result = parseSingleSession(file([SEANCE]));

    expect(result).toMatchObject({ ok: true, seance: SEANCE });
  });

  it('signale un JSON mal formé sans lever d’exception', () => {
    const result = parseSingleSession('{ "kind": ');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('racine');
      expect(result.issues[0]?.message).toMatch(/JSON mal formé/);
    }
  });

  it('refuse un fichier de plusieurs séances et renvoie vers l’import multiple', () => {
    const result = parseSingleSession(file([SEANCE, SEANCE]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        expect.objectContaining({
          path: 'seances',
          message: expect.stringContaining('Importer des séances'),
        }),
      ]);
    }
  });

  it('donne le chemin JSON exact de chaque erreur de module', () => {
    const invalid = {
      ...SEANCE,
      modules: [SEANCE.modules[0], { ...MODULE, durationMinutes: 0 }],
    };
    const result = parseSingleSession(file([invalid]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toEqual([
        'seances[0].modules[1].durationMinutes',
      ]);
    }
  });

  it('refuse un type de module et un champ inconnus', () => {
    const invalid = {
      ...SEANCE,
      modules: [{ ...SEANCE.modules[0], type: 'sprint' }],
      surprise: true,
    };
    const result = parseSingleSession(file([invalid]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toEqual([
        'seances[0].surprise',
        'seances[0].modules[0].type',
      ]);
    }
  });

  it('refuse une date qui n’existe pas', () => {
    const result = parseSingleSession(file([{ ...SEANCE, date: '2026-02-30' }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('seances[0].date');
    }
  });

  it('refuse une heure hors du format HH:MM', () => {
    const result = parseSingleSession(file([{ ...SEANCE, startTime: '6pm' }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('seances[0].startTime');
    }
  });

  it('refuse une durée décimale et un effort hors de 1 à 10', () => {
    const result = parseSingleSession(
      file([
        {
          ...SEANCE,
          durationMinutes: 45.5,
          modules: [{ ...MODULE, perceivedEffort: 11 }],
        },
      ]),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.path)).toEqual([
        'seances[0].durationMinutes',
        'seances[0].modules[0].perceivedEffort',
      ]);
    }
  });

  it('refuse une discipline absente du référentiel quand il est fourni', () => {
    const result = parseSingleSession(file([SEANCE]), new Set(['cycling']));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        { path: 'seances[0].disciplineTypeKey', message: 'discipline absente du référentiel' },
      ]);
    }
  });

  it('refuse une séance sans module', () => {
    const result = parseSingleSession(file([{ ...SEANCE, modules: [] }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('seances[0].modules');
    }
  });
});

describe('countSessions', () => {
  it('compte les séances sans les valider et renvoie le contenu', () => {
    const result = countSessions(file([SEANCE, { anything: true }]));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.count).toBe(2);
      expect(result.content['kind']).toBe('plan-seances');
    }
  });

  it('refuse un JSON mal formé ou sans liste de séances', () => {
    expect(countSessions('pas du json').ok).toBe(false);
    expect(countSessions('{"kind":"plan-seances"}').ok).toBe(false);
    expect(countSessions('{"seances":[]}').ok).toBe(false);
  });
});

describe('toPrefill', () => {
  it('ne reprend que les champs présents dans le fichier', () => {
    const prefill = toPrefill({
      date: '2026-11-20',
      disciplineTypeKey: 'running',
      durationMinutes: 45,
      modules: [MODULE],
    });

    expect(prefill).toEqual({
      date: '2026-11-20',
      disciplineTypeKey: 'running',
      durationMinutes: 45,
      modules: [{ ...MODULE, perceivedEffort: 7 }],
    });
    expect(prefill).not.toHaveProperty('startTime');
    expect(prefill).not.toHaveProperty('description');
  });

  it('reprend l’heure et la description quand elles sont renseignées', () => {
    const prefill = toPrefill(SEANCE);

    expect(prefill.startTime).toBe('18:00');
    expect(prefill.description).toBe('Fond');
  });
});

describe('titre, distance et zones de la séance', () => {
  it('reprend le titre, la distance et la répartition par zone dans le pré-remplissage', () => {
    const result = parseSingleSession(
      file([
        {
          ...SEANCE,
          title: 'Fond en aisance',
          targetDistanceMeters: 10000,
          targetHrZonePercentages: [10, 20, 40, 20, 10],
        },
      ]),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(toPrefill(result.seance)).toMatchObject({
        title: 'Fond en aisance',
        targetDistanceMeters: 10000,
        targetHrZonePercentages: [10, 20, 40, 20, 10],
      });
    }
  });

  it('refuse une répartition par zone qui ne totalise pas 100 %', () => {
    const result = parseSingleSession(
      file([{ ...SEANCE, targetHrZonePercentages: [10, 20, 40, 20, 20] }]),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual([
        {
          path: 'seances[0].targetHrZonePercentages',
          message: 'les zones doivent totaliser 100 %',
        },
      ]);
    }
  });

  it('refuse un titre de plus de 200 caractères', () => {
    const result = parseSingleSession(file([{ ...SEANCE, title: 'x'.repeat(201) }]));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues[0]?.path).toBe('seances[0].title');
    }
  });
});
