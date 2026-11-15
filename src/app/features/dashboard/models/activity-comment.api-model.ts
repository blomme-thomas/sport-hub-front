/** Commentaire d'une activité tel que renvoyé par `GET` et `POST /api/activities/:id/comment`. */
export interface ActivityCommentApi {
  activityId: string;
  text: string;
  /** `generique` pour une activité sans séance rapprochée, sinon `ia`. */
  source: string;
  model: string | null;
  generatedAt: string;
}
