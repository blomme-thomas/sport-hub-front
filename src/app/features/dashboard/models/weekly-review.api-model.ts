/** Bilan hebdomadaire tel que renvoyé par `GET` et `POST /api/weekly-reviews/:week`. */
export interface WeeklyReviewApi {
  week: string;
  suivi: string;
  pointAttention: string;
  conseil: string;
  /** `generique` pour une semaine sans séance prévue, sinon la source du modèle. */
  source: string;
  model: string | null;
  generatedAt: string;
}
