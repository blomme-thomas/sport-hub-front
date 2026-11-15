/** Conseil du tableau de bord tel que renvoyé par `GET` et `POST /api/advice/dashboard/regenerate`. */
export interface DashboardAdviceApi {
  week: string;
  text: string;
  /** `insuffisant` si aucune activité n'a été enregistrée cette semaine (aucun appel au modèle). */
  source: string;
  model: string | null;
  generatedAt: string;
}
