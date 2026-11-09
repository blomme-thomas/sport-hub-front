import type { SessionOccurrence } from './session-occurrence.model';
import type { Slot } from './slot.model';

/** Une journée de la semaine affichée : créneaux et séances, dans l'ordre renvoyé par le back. */
export interface WeekDay {
  /** Date `YYYY-MM-DD`. */
  date: string;
  slots: readonly Slot[];
  sessions: readonly SessionOccurrence[];
}
