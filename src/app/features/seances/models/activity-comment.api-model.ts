/** Source du commentaire, telle que renvoyée par le back. */
export type ActivityCommentSourceApi = 'ia' | 'generique' | 'saisie-manuelle';

/** Commentaire d'une activité (`GET` et `PUT /api/activities/:id/comment`). */
export interface ActivityCommentApi {
  activityId: string;
  text: string;
  source: ActivityCommentSourceApi;
  model: string | null;
  generatedAt: string;
}
