import { http, HttpResponse } from 'msw';
import type {
  CreateGoalRequestApi,
  GoalApi,
  UpdateGoalRequestApi,
} from '../../app/features/goals/models/goal.api-model';
import { goalsListResponse } from '../fixtures/goals.fixtures';

let goals: GoalApi[] = structuredClone(goalsListResponse.items);

function goalNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:goal-not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Objectif introuvable.',
      instance: '/api/goals',
      code: 'GOAL_NOT_FOUND',
      correlationId: '3f0c2a52-9d3e-4a52-8f43-1d2b5a0c9e11',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const goalsHandlers = [
  http.get('*/api/goals', () => HttpResponse.json({ items: goals })),
  http.post('*/api/goals', async ({ request }) => {
    const body = (await request.json()) as CreateGoalRequestApi;
    const created: GoalApi = {
      id: crypto.randomUUID(),
      title: body.title,
      type: body.type,
      targetDate: body.targetDate ?? null,
      eventFormat: body.eventFormat ?? null,
      targetTimeSeconds: body.targetTimeSeconds ?? null,
    };
    goals = [...goals, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('*/api/goals/:id', async ({ params, request }) => {
    const id = String(params['id']);
    const current = goals.find((goal) => goal.id === id);
    if (current === undefined) {
      return goalNotFound();
    }
    const body = (await request.json()) as UpdateGoalRequestApi;
    const updated: GoalApi = { ...current, ...body };
    goals = goals.map((goal) => (goal.id === id ? updated : goal));
    return HttpResponse.json(updated);
  }),
  http.delete('*/api/goals/:id', ({ params }) => {
    const id = String(params['id']);
    if (!goals.some((goal) => goal.id === id)) {
      return goalNotFound();
    }
    goals = goals.filter((goal) => goal.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
