export type GoalType = 'evenement' | 'volume' | 'regularite';

export type EventFormat = 'sprint' | 'olympique' | 'half' | 'full' | 'autre';

/** Temps cible décomposé en heures, minutes et secondes. */
export interface TargetTime {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Saisie d'un temps cible ; un champ vide vaut `null`. */
export interface TargetTimeInput {
  hours: number | null;
  minutes: number | null;
  seconds: number | null;
}

export interface Goal {
  id: string;
  title: string;
  type: GoalType;
  /** Date `YYYY-MM-DD`, sans heure ni fuseau. */
  targetDate: string | null;
  eventFormat: EventFormat | null;
  targetTime: TargetTime | null;
}

/** Valeurs saisies dans le formulaire, avant conversion vers le contrat API. */
export interface GoalInput {
  title: string;
  type: GoalType;
  targetDate: string | null;
  eventFormat: EventFormat | null;
  targetTime: TargetTimeInput;
}
