import type { Slot } from './slot.model';

/** Une journée de la semaine affichée, avec ses créneaux dans l'ordre renvoyé par le back. */
export interface WeekDay {
  /** Date `YYYY-MM-DD`. */
  date: string;
  slots: readonly Slot[];
}
