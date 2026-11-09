import type { SessionOccurrence } from './session-occurrence.model';
import type { Slot } from './slot.model';

/**
 * Une journée de la semaine affichée : séances. Les créneaux ne sont plus affichés sur le calendrier.
 */
export interface WeekDay {
  /** Date `YYYY-MM-DD`. */
  date: string;
  slots: readonly Slot[];
  sessions: readonly SessionOccurrence[];
}
