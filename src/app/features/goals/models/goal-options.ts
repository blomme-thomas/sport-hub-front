import type { EventFormat, GoalType } from './goal.model';

export interface GoalOption<T extends string> {
  value: T;
  label: string;
}

export const GOAL_TYPES: readonly GoalOption<GoalType>[] = [
  { value: 'evenement', label: 'Événement' },
  { value: 'volume', label: 'Volume' },
  { value: 'regularite', label: 'Régularité' },
];

export const EVENT_FORMATS: readonly GoalOption<EventFormat>[] = [
  { value: 'sprint', label: 'Sprint' },
  { value: 'olympique', label: 'Olympique' },
  { value: 'half', label: 'Half (semi-distance)' },
  { value: 'full', label: 'Full (distance complète)' },
  { value: 'autre', label: 'Autre' },
];
