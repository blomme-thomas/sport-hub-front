import { describe, expect, it } from 'vitest';
import {
  weeklyGoalApi,
  weeklyGoalWithoutTargetApi,
} from '../../../../mocks/fixtures/weekly-goal.fixtures';
import { toWeeklyGoalView } from './weekly-goal.mapper';

describe('toWeeklyGoalView', () => {
  it('calcule le pourcentage arrondi, les libellés et le statut de la cible', () => {
    const view = toWeeklyGoalView(weeklyGoalApi);

    expect(view.doneLabel).toBe('6h 42');
    expect(view.targetLabel).toBe('8h 00');
    expect(view.percent).toBe(84);
    expect(view.statusMessage).toBe('Très bien !');
  });

  it('renvoie le pourcentage et le statut absents sans objectif, jamais 0 %', () => {
    const view = toWeeklyGoalView(weeklyGoalWithoutTargetApi);

    expect(view.targetLabel).toBeNull();
    expect(view.percent).toBeNull();
    expect(view.statusMessage).toBeNull();
    expect(view.doneLabel).toBe('6h 42');
  });

  it('garde un pourcentage supérieur à 100 quand la cible est dépassée', () => {
    const view = toWeeklyGoalView({ ...weeklyGoalApi, doneSeconds: 36000 });

    expect(view.percent).toBe(125);
    expect(view.statusMessage).toBe('Objectif atteint !');
  });

  it('convertit l’historique en heures, dans l’ordre reçu', () => {
    const view = toWeeklyGoalView(weeklyGoalApi);

    expect(view.trend).toHaveLength(8);
    expect(view.trend.at(-1)).toEqual({ label: '2026-W47', hours: 24120 / 3600 });
  });

  it('traite une réponse incomplète comme absente, sans valeur fictive', () => {
    const view = toWeeklyGoalView({
      week: '2026-W47',
      targetSeconds: undefined,
      doneSeconds: undefined,
      history: undefined,
    } as unknown as Parameters<typeof toWeeklyGoalView>[0]);

    expect(view.targetLabel).toBeNull();
    expect(view.percent).toBeNull();
    expect(view.trend).toEqual([]);
  });
});
