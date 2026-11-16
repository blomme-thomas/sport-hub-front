import { describe, expect, it } from 'vitest';
import {
  WEEKLY_GOAL_MESSAGES,
  WEEKLY_GOAL_THRESHOLDS,
  weeklyGoalStatusOf,
} from './weekly-goal-status';

describe('weeklyGoalStatusOf', () => {
  it('garde des seuils fixes : atteint à 100, très bien à 75, en bonne voie à 50', () => {
    expect(WEEKLY_GOAL_THRESHOLDS).toEqual({ reached: 100, veryGood: 75, onTrack: 50 });
  });

  it.each([
    [150, WEEKLY_GOAL_MESSAGES.reached],
    [100, WEEKLY_GOAL_MESSAGES.reached],
    [99, WEEKLY_GOAL_MESSAGES.veryGood],
    [75, WEEKLY_GOAL_MESSAGES.veryGood],
    [74, WEEKLY_GOAL_MESSAGES.onTrack],
    [50, WEEKLY_GOAL_MESSAGES.onTrack],
    [49, WEEKLY_GOAL_MESSAGES.toStrengthen],
    [0, WEEKLY_GOAL_MESSAGES.toStrengthen],
  ])('à %i %% affiche « %s »', (percent, message) => {
    expect(weeklyGoalStatusOf(percent)).toBe(message);
  });
});
