/** Commentaire d'une activité réalisée, affiché dans le détail de l'activité. */
export interface ActivityComment {
  text: string;
  /** Vrai pour un commentaire générique (activité sans séance rapprochée). */
  generic: boolean;
  model: string | null;
  /** Date de génération, au format ISO 8601 renvoyé par l'API. */
  generatedAt: string;
}
