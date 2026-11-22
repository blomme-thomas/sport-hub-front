import { TEXTS } from '@shared/texts/texts';
import type { EventFormat, GoalType } from './goal.model';

export interface GoalOption<T extends string> {
  value: T;
  label: string;
}

export const GOAL_TYPES: readonly GoalOption<GoalType>[] = [
  { value: 'evenement', label: TEXTS.goals.types.evenement },
  { value: 'volume', label: TEXTS.goals.types.volume },
  { value: 'regularite', label: TEXTS.goals.types.regularite },
];

export const EVENT_FORMATS: readonly GoalOption<EventFormat>[] = [
  { value: 'sprint', label: TEXTS.goals.formats.sprint },
  { value: 'olympique', label: TEXTS.goals.formats.olympique },
  { value: 'half', label: TEXTS.goals.formats.half },
  { value: 'full', label: TEXTS.goals.formats.full },
  { value: 'autre', label: TEXTS.goals.formats.autre },
];
