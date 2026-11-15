import type { DashboardAdviceApi } from '../../app/features/dashboard/models/dashboard-advice.api-model';

export const adviceApi: DashboardAdviceApi = {
  week: '2026-W46',
  text: 'Belle semaine de volume, garde la séance facile de jeudi et une vraie journée de repos.',
  source: 'ia',
  model: 'claude-sonnet-5-5',
  generatedAt: '2026-11-09T18:30:00.000Z',
};

export const insufficientAdviceApi: DashboardAdviceApi = {
  ...adviceApi,
  text: 'Pas encore assez d’activités cette semaine pour un conseil personnalisé.',
  source: 'insuffisant',
  model: null,
};
