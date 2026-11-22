import type { DashboardAdviceApi } from '../../app/features/dashboard/models/dashboard-advice.api-model';

export const dashboardAdviceApi: DashboardAdviceApi = {
  week: '2026-W46',
  text: 'Belle semaine de volume, garde la séance facile de jeudi.',
  source: 'ia',
  model: 'claude-sonnet-5-5',
  generatedAt: '2026-11-09T18:30:00.000Z',
};

export const insufficientDashboardAdviceApi: DashboardAdviceApi = {
  ...dashboardAdviceApi,
  text: 'Données insuffisantes pour un conseil cette semaine.',
  source: 'insuffisant',
  model: null,
};
