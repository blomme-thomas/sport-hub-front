/** Conseil du tableau de bord affiché dans la carte « Conseil IA personnalisé ». */
export interface DashboardAdvice {
  /** Semaine ISO `AAAA-Www`. */
  week: string;
  /** Texte brut, jamais interprété comme du HTML. */
  text: string;
  /** Vrai quand la semaine n'a pas assez de données pour un conseil. */
  insufficient: boolean;
  /** Date de génération, au format ISO 8601 renvoyé par l'API. */
  generatedAt: string;
}
