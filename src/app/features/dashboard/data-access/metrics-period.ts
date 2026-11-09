import type { Granularity } from '../models/training-stats.model';

/** Période des indicateurs (bandeau et « Vos performances »), telle qu'attendue par `GET /api/stats/dashboard`. */
export type MetricsPeriod = '7d' | '30d';

/**
 * Période des indicateurs, dérivée de la temporalité choisie en haut à droite du tableau de bord :
 * semaine → 7 derniers jours, mois → 30 derniers jours.
 */
export function metricsPeriodFor(granularity: Granularity): MetricsPeriod {
  return granularity === 'month' ? '30d' : '7d';
}
