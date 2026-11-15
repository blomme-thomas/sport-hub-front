import { http, HttpResponse } from 'msw';
import type { DashboardAdviceApi } from '../../app/features/dashboard/models/dashboard-advice.api-model';
import { adviceApi } from '../fixtures/dashboard-advice.fixtures';

/** Conseil stocké de la semaine courante. Absent au départ : la génération l'ajoute. */
let stored: DashboardAdviceApi | null = null;

function adviceNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:dashboard-advice-not-found',
      title: 'Not Found',
      status: 404,
      detail: "Aucun conseil n'a encore été généré pour cette semaine.",
      instance: '/api/advice/dashboard',
      code: 'DASHBOARD_ADVICE_NOT_FOUND',
      correlationId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const dashboardAdviceHandlers = [
  http.get('*/api/advice/dashboard', () =>
    stored === null ? adviceNotFound() : HttpResponse.json(stored),
  ),
  http.post('*/api/advice/dashboard/regenerate', () => {
    stored = { ...adviceApi, generatedAt: new Date().toISOString() };
    return HttpResponse.json(stored, { status: 201 });
  }),
];
