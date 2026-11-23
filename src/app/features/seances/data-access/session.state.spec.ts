import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  completedSessionApi,
  disciplinesFixtures,
  SESSION_DONE_ID,
  SESSION_ID,
  sessionApi,
} from '../../../../mocks/fixtures/sessions.fixtures';
import {
  SESSIONS_URL,
  sessionProblem,
  sessionsTestProviders,
  trackModulesReplace,
} from '../../../../mocks/sessions.testing';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import { SessionState } from './session.state';

function setup(): SessionState {
  TestBed.configureTestingModule({
    providers: [...sessionsTestProviders(), SessionState],
  });
  return TestBed.inject(SessionState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

function useSession(body: object, status = 200): void {
  server.use(http.get(`${SESSIONS_URL}/:id`, () => HttpResponse.json(body, { status })));
}

function useDisciplines(): void {
  server.use(
    http.get('*/api/sessions/disciplines', () => HttpResponse.json({ items: disciplinesFixtures })),
  );
}

async function loaded(): Promise<SessionState> {
  useDisciplines();
  const state = setup();
  await state.load(SESSION_ID);
  return state;
}

describe('SessionState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-08T10:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('charge la séance avec le libellé de sa discipline et un brouillon des modules', async () => {
    const state = await loaded();

    expect(state.session()?.disciplineLabel).toBe('Course à pied');
    expect(state.draft().map((module) => module.type)).toEqual([
      'echauffement',
      'series',
      'retour_au_calme',
    ]);
    expect(state.dirty()).toBe(false);
    expect(state.readOnly()).toBe(false);
  });

  it('garde le code de discipline si le référentiel est indisponible', async () => {
    server.use(
      http.get('*/api/sessions/disciplines', () => new HttpResponse(null, { status: 500 })),
    );
    const state = setup();

    await state.load(SESSION_ID);

    expect(state.session()?.disciplineLabel).toBe('course_a_pied');
  });

  it('expose une erreur quand la séance est introuvable', async () => {
    useDisciplines();
    server.use(http.get(`${SESSIONS_URL}/:id`, () => sessionProblem(404, 'SESSION_NOT_FOUND')));
    const state = setup();

    await state.load('inconnue');

    expect(state.session()).toBeNull();
    expect(state.error()?.code).toBe('SESSION_NOT_FOUND');
  });

  it('modifie la durée, la consigne et le type d’un module dans le brouillon seulement', async () => {
    const state = await loaded();
    const [echauffement] = state.draft();
    const key = echauffement?.key ?? -1;

    state.setDuration(key, 15);
    state.setInstruction(key, 'Footing très souple');
    state.setType(key, 'educatifs');

    expect(state.draft()[0]).toMatchObject({
      durationMinutes: 15,
      instruction: 'Footing très souple',
      type: 'educatifs',
    });
    expect(state.session()?.modules[0]?.durationMinutes).toBe(10);
    expect(state.dirty()).toBe(true);
    expect(state.totalMinutes()).toBe(15 + 25 + 10);
  });

  it('réordonne les modules et ajoute ou supprime un module', async () => {
    const state = await loaded();
    const [first, second] = state.draft();
    state.moveTo(first?.key ?? -1, 1);

    expect(state.draft()[0]?.key).toBe(second?.key);
    expect(state.draft()[1]?.key).toBe(first?.key);

    state.add();
    expect(state.draft()).toHaveLength(4);
    expect(state.draft()[3]).toMatchObject({ type: 'series', durationMinutes: 10 });

    state.remove(state.draft()[3]?.key ?? -1);
    expect(state.draft()).toHaveLength(3);
  });

  it('refuse une durée hors bornes et une consigne vide, et bloque l’enregistrement', async () => {
    const state = await loaded();
    const [first] = state.draft();
    const key = first?.key ?? -1;

    state.setDuration(key, 0);
    expect(state.invalidKeys().has(key)).toBe(true);
    expect(state.canSave()).toBe(false);

    state.setDuration(key, 1441);
    expect(state.invalidKeys().has(key)).toBe(true);

    state.setDuration(key, 10);
    state.setInstruction(key, '   ');
    expect(state.invalidKeys().has(key)).toBe(true);
  });

  it('enregistre le brouillon par PUT et remplace la séance par la réponse', async () => {
    const state = await loaded();
    const bodies = trackModulesReplace(() =>
      HttpResponse.json({
        ...sessionApi,
        modules: sessionApi.modules.map((module, index) =>
          index === 0 ? { ...module, durationMinutes: 12 } : module,
        ),
        modifiedManually: true,
        carbsGrams: null,
        carbsUnit: null,
        hydrationMilliliters: null,
      }),
    );
    const [first] = state.draft();
    state.setDuration(first?.key ?? -1, 12);

    const saved = await state.save();

    expect(saved).toBe(true);
    expect(bodies).toHaveLength(1);
    expect(state.session()?.modules[0]?.durationMinutes).toBe(12);
    expect(state.dirty()).toBe(false);
  });

  it('garde le brouillon et expose l’erreur quand le back refuse, par exemple une séance réalisée', async () => {
    const state = await loaded();
    trackModulesReplace(() => sessionProblem(409, 'SESSION_ALREADY_COMPLETED'));
    state.setDuration(state.draft()[0]?.key ?? -1, 12);

    const saved = await state.save();

    expect(saved).toBe(false);
    expect(state.saveError()).toBeInstanceOf(AppError);
    expect(state.saveError()?.userMessage).toBe(ERROR_MESSAGES['SESSION_ALREADY_COMPLETED']);
    expect(state.draft()[0]?.durationMinutes).toBe(12);
    expect(state.saving()).toBe(false);
  });

  it('rétablit le brouillon sur la séance enregistrée', async () => {
    const state = await loaded();
    state.setDuration(state.draft()[0]?.key ?? -1, 99);

    state.revert();

    expect(state.draft()[0]?.durationMinutes).toBe(10);
    expect(state.dirty()).toBe(false);
  });

  it('passe en lecture seule une séance réalisée et n’autorise pas l’enregistrement', async () => {
    useDisciplines();
    useSession(completedSessionApi);
    const state = setup();

    await state.load(SESSION_DONE_ID);
    state.setDuration(state.draft()[0]?.key ?? -1, 99);

    expect(state.readOnly()).toBe(true);
    expect(state.canSave()).toBe(false);
    await expect(state.save()).resolves.toBe(false);
  });

  it('ne charge pas une séance dont la réponse arrive après une autre demande', async () => {
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    useDisciplines();
    let calls = 0;
    server.use(
      http.get(`${SESSIONS_URL}/:id`, async () => {
        calls += 1;
        if (calls === 1) {
          await gate;
          return HttpResponse.json({ ...sessionApi, id: 'ancienne', date: '2026-01-01' });
        }
        return HttpResponse.json({ ...sessionApi, id: 'recente' });
      }),
    );
    const state = setup();

    const first = state.load('ancienne');
    await state.load('recente');
    releaseFirst();
    await first;

    expect(state.session()?.id).toBe('recente');
  });

  it('expose un chargement qui se termine', async () => {
    useDisciplines();
    const state = setup();

    const loading = state.load(SESSION_ID);
    await settle(() => expect(state.isLoading()).toBe(true));
    await loading;

    expect(state.isLoading()).toBe(false);
  });
});

describe('SessionState.saveDetails', () => {
  function trackPatch(respond: (body: Record<string, unknown>) => Response): unknown[] {
    const bodies: unknown[] = [];
    server.use(
      http.patch(`${SESSIONS_URL}/:id`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        bodies.push(body);
        return respond(body);
      }),
    );
    return bodies;
  }

  it('enregistre les champs de la séance sans toucher aux modules quand aucun fichier n’en fournit', async () => {
    const state = await loaded();
    const patches = trackPatch((body) =>
      HttpResponse.json({ ...sessionApi, ...body, modifiedManually: true }),
    );
    const modules = trackModulesReplace();

    const saved = await state.saveDetails(
      { date: '2026-11-20', startTime: '18:00', description: null },
      null,
    );

    expect(saved).toBe(true);
    expect(patches).toEqual([{ date: '2026-11-20', startTime: '18:00', description: null }]);
    expect(modules).toEqual([]);
    expect(state.session()?.date).toBe('2026-11-20');
    expect(state.session()?.startTime).toBe('18:00');
  });

  it('supprime la séance et renvoie true', async () => {
    const state = await loaded();
    let deletedId: string | null = null;
    server.use(
      http.delete(`${SESSIONS_URL}/:id`, ({ params }) => {
        deletedId = String(params['id']);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    expect(await state.delete()).toBe(true);
    expect(deletedId).toBe(sessionApi.id);
    expect(state.saveError()).toBeNull();
  });

  it('garde la séance et conserve l’erreur quand la suppression échoue', async () => {
    const state = await loaded();
    server.use(
      http.delete(`${SESSIONS_URL}/:id`, () =>
        HttpResponse.json(
          {
            type: 'urn:sport-hub:problem:internal',
            title: 'Erreur',
            status: 500,
            detail: 'Erreur',
            code: 'INTERNAL',
          },
          { status: 500, headers: { 'Content-Type': 'application/problem+json' } },
        ),
      ),
    );

    expect(await state.delete()).toBe(false);
    expect(state.session()?.id).toBe(sessionApi.id);
    expect(state.saveError()).not.toBeNull();
  });

  it('enregistre les champs puis remplace les modules par ceux du fichier', async () => {
    const state = await loaded();
    trackPatch((body) => HttpResponse.json({ ...sessionApi, ...body, modifiedManually: true }));
    const bodies = trackModulesReplace((): Response =>
      HttpResponse.json({
        ...sessionApi,
        durationMinutes: 70,
        modifiedManually: true,
        carbsGrams: null,
        carbsUnit: null,
        hydrationMilliliters: null,
        modules: [],
      }),
    );
    const imported = [
      {
        type: 'educatifs' as const,
        durationMinutes: 30,
        instruction: 'Cadence 100 rpm',
        targetZones: null,
        perceivedEffort: null,
      },
    ];

    const saved = await state.saveDetails({ durationMinutes: 70 }, imported);

    expect(saved).toBe(true);
    expect(bodies).toEqual([{ modules: [{ ...imported[0] }] }]);
    expect(state.session()?.durationMinutes).toBe(70);
    expect(state.saving()).toBe(false);
  });

  it('garde la séance affichée et expose l’erreur quand le back refuse la modification', async () => {
    const state = await loaded();
    trackPatch(() => sessionProblem(409, 'SESSION_ALREADY_COMPLETED'));

    const saved = await state.saveDetails({ durationMinutes: 70 }, null);

    expect(saved).toBe(false);
    expect(state.saveError()?.userMessage).toBe(ERROR_MESSAGES['SESSION_ALREADY_COMPLETED']);
    expect(state.session()?.durationMinutes).toBe(sessionApi.durationMinutes);
  });
});
