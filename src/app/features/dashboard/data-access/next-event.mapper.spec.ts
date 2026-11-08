import { describe, expect, it } from 'vitest';
import type { NextEventGoalApi } from '../models/next-event.api-model';
import { daysUntil, toNextEvent } from './next-event.mapper';

const TODAY = '2026-11-07';

function goal(overrides: Partial<NextEventGoalApi> = {}): NextEventGoalApi {
  return {
    id: 'goal-1',
    title: 'Triathlon de Paris',
    type: 'evenement',
    targetDate: '2026-12-06',
    eventFormat: 'olympique',
    targetTimeSeconds: 9000,
    ...overrides,
  };
}

describe('daysUntil', () => {
  it('renvoie 0 quand la date est le jour même', () => {
    expect(daysUntil(TODAY, TODAY)).toBe(0);
  });

  it('compte correctement le passage d un mois à l autre', () => {
    expect(daysUntil('2026-12-01', '2026-11-30')).toBe(1);
    expect(daysUntil('2026-12-06', '2026-11-07')).toBe(29);
  });

  it('tient compte de l année bissextile', () => {
    expect(daysUntil('2028-03-01', '2028-02-28')).toBe(2);
  });

  it('ne change pas au passage à l heure d été', () => {
    expect(daysUntil('2026-03-29', '2026-03-28')).toBe(1);
  });
});

describe('toNextEvent', () => {
  it('renvoie null quand la liste est vide', () => {
    expect(toNextEvent([], TODAY)).toBeNull();
  });

  it('choisit l événement à venir le plus proche quel que soit l ordre de la liste', () => {
    const goals = [
      goal({ id: 'loin', targetDate: '2026-12-20', title: 'Lointain' }),
      goal({ id: 'proche', targetDate: '2026-11-20', title: 'Proche' }),
    ];

    expect(toNextEvent(goals, TODAY)?.id).toBe('proche');
  });

  it('inclut un événement le jour même et le renvoie à 0 jour restant', () => {
    const event = toNextEvent([goal({ targetDate: TODAY, title: 'Aujourd hui' })], TODAY);

    expect(event?.targetDate).toBe(TODAY);
    expect(daysUntil(event?.targetDate ?? '', TODAY)).toBe(0);
  });

  it('exclut un événement passé', () => {
    expect(toNextEvent([goal({ targetDate: '2026-10-01' })], TODAY)).toBeNull();
  });

  it('exclut les objectifs qui ne sont pas des événements', () => {
    const goals = [
      goal({
        type: 'volume',
        targetDate: '2026-11-10',
        eventFormat: null,
        targetTimeSeconds: null,
      }),
      goal({
        type: 'regularite',
        targetDate: '2026-11-11',
        eventFormat: null,
        targetTimeSeconds: null,
      }),
    ];

    expect(toNextEvent(goals, TODAY)).toBeNull();
  });

  it('exclut un événement sans date', () => {
    expect(toNextEvent([goal({ targetDate: null })], TODAY)).toBeNull();
  });

  it('garde l ordre de l API en cas d ex æquo sur la date', () => {
    const goals = [
      goal({ id: 'premier', targetDate: '2026-11-20' }),
      goal({ id: 'second', targetDate: '2026-11-20' }),
    ];

    expect(toNextEvent(goals, TODAY)?.id).toBe('premier');
  });

  it('mappe le format et le temps cible en libellés', () => {
    const event = toNextEvent([goal({ eventFormat: 'half', targetTimeSeconds: 5400 })], TODAY);

    expect(event).toEqual({
      id: 'goal-1',
      title: 'Triathlon de Paris',
      targetDate: '2026-12-06',
      formatLabel: 'Half (semi-distance)',
      targetTimeLabel: '1 h 30 min 0 s',
    });
  });

  it('renvoie null pour le format et le temps cible quand ils ne sont pas définis', () => {
    const event = toNextEvent([goal({ eventFormat: null, targetTimeSeconds: null })], TODAY);

    expect(event?.formatLabel).toBeNull();
    expect(event?.targetTimeLabel).toBeNull();
  });

  it.each([
    ['sprint', 'Sprint'],
    ['olympique', 'Olympique'],
    ['half', 'Half (semi-distance)'],
    ['full', 'Full (distance complète)'],
    ['autre', 'Autre'],
  ] as const)('libelle le format %s en « %s »', (format, label) => {
    expect(toNextEvent([goal({ eventFormat: format })], TODAY)?.formatLabel).toBe(label);
  });
});
