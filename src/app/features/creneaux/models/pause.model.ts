/** Motif d'une pause, tel qu'accepté par le back. */
export type PauseReason = 'blessure' | 'vacances' | 'autre';

/** Pause affichée en bandeau sur le calendrier. Les dates sont `YYYY-MM-DD`, bornes incluses. */
export interface Pause {
  id: string;
  startDate: string;
  endDate: string;
  reason: PauseReason;
}

/** Corps de `POST /api/pauses` et de `PATCH /api/pauses/:id` (champs absents = inchangés). */
export interface PauseInput {
  startDate: string;
  endDate: string;
  reason: PauseReason;
}

export const PAUSE_REASON_LABELS: Readonly<Record<PauseReason, string>> = {
  blessure: 'Blessure',
  vacances: 'Vacances',
  autre: 'Autre',
};
