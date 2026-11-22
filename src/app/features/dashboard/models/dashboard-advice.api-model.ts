/** Conseil du tableau de bord tel que renvoyé par `GET` et `POST /api/advice/dashboard[/regenerate]`. */
export interface DashboardAdviceApi {
  /** Semaine ISO `AAAA-Www`. */
  week: string;
  text: string;
  /** `ia` pour un conseil généré, `insuffisant` pour une semaine sans activité (aucun appel au modèle). */
  source: 'ia' | 'insuffisant';
  model: string | null;
  generatedAt: string;
}
