export type SlotType = 'libre' | 'occupe';

export type SlotRecurrence = 'aucune' | 'hebdomadaire';

/**
 * Créneau affiché sur une journée. `id` désigne le créneau et sa série : modifier ou supprimer
 * une occurrence agit sur toute la série.
 */
export interface Slot {
  id: string;
  type: SlotType;
  /** Date `YYYY-MM-DD`. */
  date: string;
  /** Heure murale `HH:mm`. */
  startTime: string;
  /** Heure murale `HH:mm`, toujours postérieure à `startTime`, 23:59 au plus. */
  endTime: string;
  recurrence: SlotRecurrence;
}

/** Valeurs saisies dans le formulaire, avant conversion vers le contrat API. */
export interface SlotInput {
  type: SlotType;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: SlotRecurrence;
}

/** Valeurs proposées à l'ouverture d'un formulaire de création. */
export interface SlotDefaults {
  date: string;
  startTime: string;
  endTime: string;
}
