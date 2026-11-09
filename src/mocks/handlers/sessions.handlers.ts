import { http, HttpResponse } from 'msw';
import type {
  ReplaceSessionModulesRequestApi,
  SessionApi,
  SessionModuleApi,
} from '../../app/features/seances/models/session.api-model';
import {
  completedSessionApi,
  disciplinesFixtures,
  sessionApi,
} from '../fixtures/sessions.fixtures';

let sessions: SessionApi[] = structuredClone([sessionApi, completedSessionApi]);

function problem(status: number, code: string, detail: string): Response {
  return HttpResponse.json(
    {
      type: `urn:sport-hub:problem:${code.toLowerCase().replace(/_/g, '-')}`,
      title: status === 404 ? 'Not Found' : 'Conflict',
      status,
      detail,
      instance: '/api/sessions',
      code,
      correlationId: '7c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f',
    },
    { status, headers: { 'content-type': 'application/problem+json' } },
  );
}

function sameModules(a: SessionModuleApi[], b: SessionModuleApi[]): boolean {
  return JSON.stringify(a.map(comparable)) === JSON.stringify(b.map(comparable));
}

function comparable(module: SessionModuleApi): unknown[] {
  return [
    module.type,
    module.durationMinutes,
    module.instruction,
    module.targetZones,
    module.perceivedEffort,
  ];
}

export const sessionsHandlers = [
  http.get('*/api/sessions/:id', ({ params }) => {
    const session = sessions.find((item) => item.id === String(params['id']));
    if (session === undefined) {
      return problem(404, 'SESSION_NOT_FOUND', 'Séance introuvable.');
    }
    return HttpResponse.json(session);
  }),
  http.put('*/api/sessions/:id/modules', async ({ params, request }) => {
    const id = String(params['id']);
    const session = sessions.find((item) => item.id === id);
    if (session === undefined) {
      return problem(404, 'SESSION_NOT_FOUND', 'Séance introuvable.');
    }
    if (session.status === 'realisee') {
      return problem(409, 'SESSION_ALREADY_COMPLETED', 'Séance réalisée.');
    }
    const body = (await request.json()) as ReplaceSessionModulesRequestApi;
    const modules: SessionModuleApi[] = body.modules.map((module, index) => ({
      position: index + 1,
      ...module,
    }));
    const changed = !sameModules(modules, session.modules);
    const updated: SessionApi = {
      ...session,
      modules,
      modifiedManually: session.modifiedManually || changed,
    };
    sessions = sessions.map((item) => (item.id === id ? updated : item));
    return HttpResponse.json(updated);
  }),
  http.get('*/api/disciplines', () => HttpResponse.json({ items: disciplinesFixtures })),
];
