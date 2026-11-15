import type { ActivityCommentApi } from '../models/activity-comment.api-model';
import type { ActivityComment } from '../models/activity-comment.model';

const GENERIC_SOURCE = 'generique';

/** Commentaire de l'API en modèle UI. Un commentaire générique est signalé pour l'afficher autrement. */
export function toActivityComment(api: ActivityCommentApi): ActivityComment {
  return {
    text: api.text,
    generic: api.source === GENERIC_SOURCE,
    model: api.model,
    generatedAt: api.generatedAt,
  };
}
