import type { WeeklyReviewApi } from '../../app/features/dashboard/models/weekly-review.api-model';

export const WEEK_W46 = '2026-W46';

export const weeklyReviewApi: WeeklyReviewApi = {
  week: WEEK_W46,
  suivi:
    '3 séances prévues, 2 réalisées. Volume en hausse de 12 % par rapport à la semaine précédente.',
  pointAttention: 'La séance de séries de jeudi a été manquée : vérifie ta récupération.',
  conseil: 'Garde une sortie facile en fin de semaine et une journée de repos complète.',
  source: 'claude',
  model: 'claude-sonnet-5-5',
  generatedAt: '2026-11-09T18:30:00.000Z',
};
