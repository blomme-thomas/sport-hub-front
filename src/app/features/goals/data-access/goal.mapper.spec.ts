import { describe, expect, it } from 'vitest';
import { triathlonApi, volumeUndatedApi } from '../../../../mocks/fixtures/goals.fixtures';
import type { Goal, GoalInput, GoalType } from '../models/goal.model';
import {
  partitionGoals,
  partsToSeconds,
  secondsToParts,
  toCreateRequest,
  toGoal,
  toUpdateRequest,
} from './goal.mapper';

const TODAY_ISO = '2026-11-07';

const eventInput: GoalInput = {
  title: 'Triathlon de Paris',
  type: 'evenement',
  targetDate: '2026-12-06',
  eventFormat: 'olympique',
  targetTime: { hours: 2, minutes: 30, seconds: 0 },
};

function goalOn(id: string, targetDate: string | null): Goal {
  return {
    id,
    title: id,
    type: 'evenement',
    targetDate,
    eventFormat: 'sprint',
    targetTime: null,
  };
}

describe('secondsToParts', () => {
  it('décompose un total en secondes en heures, minutes et secondes', () => {
    expect(secondsToParts(9000)).toEqual({ hours: 2, minutes: 30, seconds: 0 });
    expect(secondsToParts(3725)).toEqual({ hours: 1, minutes: 2, seconds: 5 });
  });

  it('ne reporte pas les minutes sur les heures à la frontière de l heure', () => {
    expect(secondsToParts(3599)).toEqual({ hours: 0, minutes: 59, seconds: 59 });
    expect(secondsToParts(3600)).toEqual({ hours: 1, minutes: 0, seconds: 0 });
  });

  it('renvoie des zéros pour un total nul', () => {
    expect(secondsToParts(0)).toEqual({ hours: 0, minutes: 0, seconds: 0 });
  });
});

describe('partsToSeconds', () => {
  it('additionne heures, minutes et secondes en secondes', () => {
    expect(partsToSeconds({ hours: 2, minutes: 30, seconds: 0 })).toBe(9000);
    expect(partsToSeconds({ hours: 1, minutes: 2, seconds: 5 })).toBe(3725);
  });

  it('compte un champ vide comme zéro', () => {
    expect(partsToSeconds({ hours: null, minutes: 5, seconds: null })).toBe(300);
  });

  it('ne renvoie pas null quand un seul champ est non nul à zéro', () => {
    expect(partsToSeconds({ hours: 0, minutes: 0, seconds: 5 })).toBe(5);
  });

  it('renvoie null quand les trois champs sont vides', () => {
    expect(partsToSeconds({ hours: null, minutes: null, seconds: null })).toBeNull();
  });

  it('renvoie null quand les trois champs valent zéro', () => {
    expect(partsToSeconds({ hours: 0, minutes: 0, seconds: 0 })).toBeNull();
  });

  it.each([1, 59, 3599, 3600, 9000, 2147483647])(
    'restitue %i secondes après un aller-retour par les champs h, min, s',
    (seconds) => {
      expect(partsToSeconds(secondsToParts(seconds))).toBe(seconds);
    },
  );
});

describe('toGoal', () => {
  it('convertit un événement en modèle UI avec son temps cible en heures, minutes et secondes', () => {
    expect(toGoal(triathlonApi)).toEqual({
      id: 'goal-triathlon',
      title: 'Triathlon de Paris',
      type: 'evenement',
      targetDate: '2026-12-06',
      eventFormat: 'olympique',
      targetTime: { hours: 2, minutes: 30, seconds: 0 },
    });
  });

  it('renvoie une date, un format et un temps cible nuls pour un objectif sans valeurs', () => {
    expect(toGoal(volumeUndatedApi)).toEqual({
      id: 'goal-volume',
      title: 'Volume hebdomadaire',
      type: 'volume',
      targetDate: null,
      eventFormat: null,
      targetTime: null,
    });
  });
});

describe('toCreateRequest', () => {
  it('envoie le format, la date et le temps cible en secondes pour un événement', () => {
    expect(toCreateRequest(eventInput)).toEqual({
      title: 'Triathlon de Paris',
      type: 'evenement',
      targetDate: '2026-12-06',
      eventFormat: 'olympique',
      targetTimeSeconds: 9000,
    });
  });

  it('envoie le temps cible à null quand les trois champs sont vides', () => {
    const body = toCreateRequest({
      ...eventInput,
      targetTime: { hours: null, minutes: null, seconds: null },
    });

    expect(body.targetTimeSeconds).toBeNull();
  });

  it.each<GoalType>(['volume', 'regularite'])(
    'envoie le format et le temps cible à null pour un objectif de type %s',
    (type) => {
      const body = toCreateRequest({ ...eventInput, type });

      expect(body.eventFormat).toBeNull();
      expect(body.targetTimeSeconds).toBeNull();
    },
  );

  it('envoie la date à null pour un objectif sans date', () => {
    expect(toCreateRequest({ ...eventInput, targetDate: null }).targetDate).toBeNull();
  });
});

describe('toUpdateRequest', () => {
  it('envoie les champs complets d un événement', () => {
    expect(toUpdateRequest(eventInput)).toEqual({
      title: 'Triathlon de Paris',
      type: 'evenement',
      targetDate: '2026-12-06',
      eventFormat: 'olympique',
      targetTimeSeconds: 9000,
    });
  });

  it('envoie explicitement null pour le format et le temps cible quand un événement devient un volume', () => {
    expect(toUpdateRequest({ ...eventInput, type: 'volume' })).toStrictEqual({
      title: 'Triathlon de Paris',
      type: 'volume',
      targetDate: '2026-12-06',
      eventFormat: null,
      targetTimeSeconds: null,
    });
  });

  it('efface le temps cible quand les trois champs passent à zéro', () => {
    const body = toUpdateRequest({
      ...eventInput,
      targetTime: { hours: 0, minutes: 0, seconds: 0 },
    });

    expect(body.targetTimeSeconds).toBeNull();
    expect(body.eventFormat).toBe('olympique');
  });
});

describe('partitionGoals', () => {
  it('place dans les objectifs à venir un objectif dont la date est le jour même', () => {
    const { upcoming, past } = partitionGoals([goalOn('today', TODAY_ISO)], TODAY_ISO);

    expect(upcoming.map((goal) => goal.id)).toEqual(['today']);
    expect(past).toEqual([]);
  });

  it('place dans les objectifs passés un objectif dont la date est la veille', () => {
    const { upcoming, past } = partitionGoals([goalOn('yesterday', '2026-11-06')], TODAY_ISO);

    expect(past.map((goal) => goal.id)).toEqual(['yesterday']);
    expect(upcoming).toEqual([]);
  });

  it('place dans les objectifs à venir un objectif daté du lendemain', () => {
    const { upcoming } = partitionGoals([goalOn('tomorrow', '2026-11-08')], TODAY_ISO);

    expect(upcoming.map((goal) => goal.id)).toEqual(['tomorrow']);
  });

  it('place dans les objectifs sans date les objectifs dont la date est nulle', () => {
    const { upcoming, past, undated } = partitionGoals([goalOn('undated', null)], TODAY_ISO);

    expect(undated.map((goal) => goal.id)).toEqual(['undated']);
    expect(upcoming).toEqual([]);
    expect(past).toEqual([]);
  });

  it('compare les dates ISO sans décalage de fuseau au passage d une année', () => {
    const { upcoming, past } = partitionGoals(
      [goalOn('next-year', '2027-01-01'), goalOn('last-year', '2026-12-30')],
      '2026-12-31',
    );

    expect(upcoming.map((goal) => goal.id)).toEqual(['next-year']);
    expect(past.map((goal) => goal.id)).toEqual(['last-year']);
  });

  it('répartit un mélange d objectifs dans les trois listes', () => {
    const goals = [
      goalOn('a', '2026-12-06'),
      goalOn('b', '2026-10-01'),
      goalOn('c', null),
      goalOn('d', TODAY_ISO),
    ];

    const { upcoming, past, undated } = partitionGoals(goals, TODAY_ISO);

    expect(upcoming.map((goal) => goal.id).sort()).toEqual(['a', 'd']);
    expect(past.map((goal) => goal.id)).toEqual(['b']);
    expect(undated.map((goal) => goal.id)).toEqual(['c']);
  });

  it('renvoie trois listes vides quand il n y a aucun objectif', () => {
    expect(partitionGoals([], TODAY_ISO)).toEqual({ upcoming: [], past: [], undated: [] });
  });
});
