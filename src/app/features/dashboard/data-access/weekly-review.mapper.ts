import type { WeeklyReviewApi } from '../models/weekly-review.api-model';
import type { WeeklyReview } from '../models/weekly-review.model';

const GENERIC_SOURCE = 'generique';

/** Bilan de l'API en modèle UI. Un bilan générique est signalé pour l'afficher autrement. */
export function toWeeklyReview(api: WeeklyReviewApi): WeeklyReview {
  return {
    week: api.week,
    suivi: api.suivi,
    pointAttention: api.pointAttention,
    conseil: api.conseil,
    generic: api.source === GENERIC_SOURCE,
    generatedAt: api.generatedAt,
  };
}
