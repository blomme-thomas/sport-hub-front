import type { DashboardAdviceApi } from '../models/dashboard-advice.api-model';
import type { DashboardAdvice } from '../models/dashboard-advice.model';

const INSUFFICIENT_SOURCE = 'insuffisant';

/** Conseil de l'API en modèle UI. Une semaine sans activité est signalée pour l'afficher en clair. */
export function toDashboardAdvice(api: DashboardAdviceApi): DashboardAdvice {
  return {
    week: api.week,
    text: api.text,
    insufficient: api.source === INSUFFICIENT_SOURCE,
    generatedAt: api.generatedAt,
  };
}
