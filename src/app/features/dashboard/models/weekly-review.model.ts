/** Bilan de la semaine ISO affiché sur le tableau de bord. */
export interface WeeklyReview {
  /** Semaine ISO `AAAA-Www`. */
  week: string;
  suivi: string;
  pointAttention: string;
  conseil: string;
  /** Vrai pour un bilan générique (semaine sans séance prévue). */
  generic: boolean;
  /** Date de génération, au format ISO 8601 renvoyé par l'API. */
  generatedAt: string;
}
