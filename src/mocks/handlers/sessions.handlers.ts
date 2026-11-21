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

const IMPORT_KIND = 'plan-seances';
const importedIds = new Set<string>();

/** Séance du back à partir d'un corps de création ou d'une séance d'un fichier d'import. */
function sessionFromBody(body: Record<string, unknown>): SessionApi {
  const modules = (body['modules'] as SessionModuleApi[] | undefined) ?? [];
  return {
    id: crypto.randomUUID(),
    date: String(body['date']),
    disciplineTypeKey: String(body['disciplineTypeKey']),
    durationMinutes: Number(body['durationMinutes']),
    startTime: (body['startTime'] as string | null | undefined) ?? null,
    status: 'planifiee',
    modifiedManually: false,
    description: (body['description'] as string | null | undefined) ?? null,
    title: (body['title'] as string | null | undefined) ?? null,
    modules: modules.map((module, index) => ({ ...module, position: index + 1 })),
    changeLog: [],
    targetDistanceMeters: (body['targetDistanceMeters'] as number | undefined) ?? null,
    targetHrZonePercentages: (body['targetHrZonePercentages'] as number[] | undefined) ?? null,
    achievement: null,
    activity: null,
  };
}

export const sessionsHandlers = [
  http.post('*/api/sessions', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const created = sessionFromBody(body);
    sessions = [...sessions, created];
    return HttpResponse.json({ id: created.id }, { status: 201 });
  }),
  http.post('*/api/sessions/import', async ({ request }) => {
    const body = (await request.json()) as {
      kind?: string;
      importId?: string;
      seances?: Record<string, unknown>[];
    };
    if (body.kind !== IMPORT_KIND) {
      return problem(400, 'SESSION_IMPORT_INVALID', 'Fichier plan-seances attendu.');
    }
    if (body.importId !== undefined && importedIds.has(body.importId)) {
      return problem(409, 'SESSION_IMPORT_ALREADY_DONE', 'Fichier déjà importé.');
    }
    const created = (body.seances ?? []).map((seance) => sessionFromBody(seance));
    sessions = [...sessions, ...created];
    if (body.importId !== undefined) {
      importedIds.add(body.importId);
    }
    return HttpResponse.json(
      {
        importId: body.importId ?? crypto.randomUUID(),
        createdCount: created.length,
        sessionIds: created.map((session) => session.id),
      },
      { status: 201 },
    );
  }),
  http.patch('*/api/sessions/:id', async ({ params, request }) => {
    const id = String(params['id']);
    const session = sessions.find((item) => item.id === id);
    if (session === undefined) {
      return problem(404, 'SESSION_NOT_FOUND', 'Séance introuvable.');
    }
    if (session.status === 'realisee') {
      return problem(409, 'SESSION_ALREADY_COMPLETED', 'Séance réalisée.');
    }
    const body = (await request.json()) as Partial<SessionApi>;
    const updated: SessionApi = {
      ...session,
      ...(body.date !== undefined && { date: body.date }),
      ...(body.disciplineTypeKey !== undefined && { disciplineTypeKey: body.disciplineTypeKey }),
      ...(body.durationMinutes !== undefined && { durationMinutes: body.durationMinutes }),
      ...(body.startTime !== undefined && { startTime: body.startTime }),
      ...(body.description !== undefined && { description: body.description }),
      modifiedManually: true,
    };
    sessions = sessions.map((item) => (item.id === id ? updated : item));
    return HttpResponse.json(updated);
  }),
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
  http.get('*/api/sessions', ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('from') ?? '';
    const to = url.searchParams.get('to') ?? '';
    // Occurrences des séances ponctuelles de la période (le mock ne calcule pas la récurrence).
    const items = sessions
      .filter((session) => session.date >= from && session.date <= to)
      .map((session) => ({
        sessionId: session.id,
        date: session.date,
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        disciplineTypeKey: session.disciplineTypeKey,
        recurrence: 'aucune',
        status: session.status,
      }));
    return HttpResponse.json({ items });
  }),
  http.get('*/api/disciplines', () => HttpResponse.json({ items: disciplinesFixtures })),
];
