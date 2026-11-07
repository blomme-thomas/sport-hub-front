import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { goalsListResponse, triathlonApi } from '../../../../mocks/fixtures/goals.fixtures';
import {
  GOALS_URL,
  goalsTestProviders,
  problemResponse,
  trackGoalsList,
  validationProblem,
} from '../../../../mocks/goals.testing';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import type { GoalApi } from '../models/goal.api-model';
import type { GoalInput } from '../models/goal.model';
import { GoalsState } from './goals.state';

const newGoal: GoalInput = {
  title: 'Semi de Nantes',
  type: 'evenement',
  targetDate: '2026-11-22',
  eventFormat: 'half',
  targetTime: { hours: 1, minutes: 45, seconds: 0 },
};

function setup(): GoalsState {
  TestBed.configureTestingModule({
    providers: [...goalsTestProviders(), GoalsState],
  });
  return TestBed.inject(GoalsState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

function titlesOf(goals: readonly { title: string }[]): string[] {
  return goals.map((goal) => goal.title).sort();
}

describe('GoalsState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-07T10:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expose l état de chargement pendant la requête puis le termine', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests = trackGoalsList(async () => {
      await gate;
      return HttpResponse.json(goalsListResponse);
    });

    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    expect(state.isLoading()).toBe(true);
    expect(state.isEmpty()).toBe(false);

    release();

    await settle(() => expect(state.isLoading()).toBe(false));
    expect(state.error()).toBeNull();
  });

  it('répartit les objectifs chargés en à venir, passés et sans date', async () => {
    trackGoalsList();

    const state = setup();
    await settle(() => expect(state.upcoming()).not.toHaveLength(0));

    expect(titlesOf(state.upcoming())).toEqual(['Course du jour', 'Triathlon de Paris']);
    expect(titlesOf(state.past())).toEqual(['Semi-marathon de Lyon']);
    expect(titlesOf(state.undated())).toEqual(['Volume hebdomadaire']);
  });

  it('signale un état vide quand aucun objectif n est enregistré', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [] }));

    const state = setup();
    await settle(() => expect(state.isLoading()).toBe(false));

    expect(state.isEmpty()).toBe(true);
    expect(state.upcoming()).toEqual([]);
    expect(state.past()).toEqual([]);
    expect(state.undated()).toEqual([]);
  });

  it('ne signale pas d état vide dès qu un objectif existe', async () => {
    trackGoalsList();

    const state = setup();
    await settle(() => expect(state.isLoading()).toBe(false));

    expect(state.isEmpty()).toBe(false);
  });

  it('expose une AppError typée et aucune liste quand le chargement échoue', async () => {
    trackGoalsList(() => problemResponse(500, 'INTERNAL_ERROR'));

    const state = setup();
    await settle(() => expect(state.error()).not.toBeNull());

    expect(state.error()).toBeInstanceOf(AppError);
    expect(state.error()?.code).toBe('INTERNAL_ERROR');
    expect(state.error()?.userMessage).toContain(ERROR_MESSAGES['INTERNAL_ERROR']);
    expect(state.upcoming()).toEqual([]);
    expect(state.isLoading()).toBe(false);
  });

  it('relance le chargement au rechargement après une erreur et efface l erreur', async () => {
    let calls = 0;
    const requests = trackGoalsList(() => {
      calls += 1;
      return calls === 1
        ? problemResponse(500, 'INTERNAL_ERROR')
        : HttpResponse.json(goalsListResponse);
    });
    const state = setup();
    await settle(() => expect(state.error()).not.toBeNull());

    state.reload();

    await settle(() => expect(state.error()).toBeNull());
    await settle(() => expect(state.upcoming()).not.toHaveLength(0));
    expect(requests).toHaveLength(2);
  });

  it('crée l objectif avec le corps de création puis recharge la liste', async () => {
    const items: GoalApi[] = [...goalsListResponse.items];
    const requests = trackGoalsList(() => HttpResponse.json({ items }));
    const bodies: unknown[] = [];
    server.use(
      http.post(GOALS_URL, async ({ request }) => {
        bodies.push(await request.json());
        const created: GoalApi = {
          id: 'goal-semi-nantes',
          title: 'Semi de Nantes',
          type: 'evenement',
          targetDate: '2026-11-22',
          eventFormat: 'half',
          targetTimeSeconds: 6300,
        };
        items.push(created);
        return HttpResponse.json(created, { status: 201 });
      }),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    await state.create(newGoal);

    await settle(() => expect(titlesOf(state.upcoming())).toContain('Semi de Nantes'));
    expect(bodies).toEqual([
      {
        title: 'Semi de Nantes',
        type: 'evenement',
        targetDate: '2026-11-22',
        eventFormat: 'half',
        targetTimeSeconds: 6300,
      },
    ]);
    expect(requests).toHaveLength(2);
  });

  it('rejette la création avec une AppError portant les erreurs par champ sans recharger la liste', async () => {
    const requests = trackGoalsList();
    server.use(
      http.post(GOALS_URL, () =>
        validationProblem([
          {
            field: 'targetTimeSeconds',
            code: 'OUT_OF_RANGE',
            message: 'Le temps cible doit être positif.',
          },
        ]),
      ),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    const result = state.create({ ...newGoal, targetTime: { hours: -1, minutes: 0, seconds: 0 } });

    await expect(result).rejects.toBeInstanceOf(AppError);
    await expect(result).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
      fieldErrors: [{ field: 'targetTimeSeconds', message: 'Le temps cible doit être positif.' }],
    });
    expect(requests).toHaveLength(1);
  });

  it('met à jour l objectif par PATCH sur son identifiant puis recharge la liste', async () => {
    const requests = trackGoalsList();
    const patched: { id: string; body: unknown }[] = [];
    server.use(
      http.patch(`${GOALS_URL}/:id`, async ({ params, request }) => {
        patched.push({ id: String(params['id']), body: await request.json() });
        return HttpResponse.json({ ...triathlonApi, title: 'Triathlon de Lyon' });
      }),
    );
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    await state.update('goal-triathlon', { ...newGoal, title: 'Triathlon de Lyon' });

    await settle(() => expect(requests).toHaveLength(2));
    expect(patched).toEqual([
      {
        id: 'goal-triathlon',
        body: {
          title: 'Triathlon de Lyon',
          type: 'evenement',
          targetDate: '2026-11-22',
          eventFormat: 'half',
          targetTimeSeconds: 6300,
        },
      },
    ]);
  });

  it('supprime l objectif par DELETE puis recharge la liste sans lui', async () => {
    let items: GoalApi[] = [...goalsListResponse.items];
    const requests = trackGoalsList(() => HttpResponse.json({ items }));
    const deletedIds: string[] = [];
    server.use(
      http.delete(`${GOALS_URL}/:id`, ({ params }) => {
        const id = String(params['id']);
        deletedIds.push(id);
        items = items.filter((item) => item.id !== id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const state = setup();
    await settle(() => expect(titlesOf(state.upcoming())).toContain('Triathlon de Paris'));

    await state.remove('goal-triathlon');

    await settle(() => expect(titlesOf(state.upcoming())).not.toContain('Triathlon de Paris'));
    expect(deletedIds).toEqual(['goal-triathlon']);
    expect(requests).toHaveLength(2);
  });

  it('expose saving pendant l écriture puis le termine', async () => {
    trackGoalsList();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.post(GOALS_URL, async () => {
        await gate;
        return HttpResponse.json(triathlonApi, { status: 201 });
      }),
    );
    const state = setup();

    const pending = state.create(newGoal);
    await settle(() => expect(state.saving()).toBe(true));

    release();
    await pending;

    await settle(() => expect(state.saving()).toBe(false));
  });

  it('rejette la suppression d un objectif introuvable avec GOAL_NOT_FOUND sans recharger la liste', async () => {
    const requests = trackGoalsList();
    server.use(http.delete(`${GOALS_URL}/:id`, () => problemResponse(404, 'GOAL_NOT_FOUND')));
    const state = setup();
    await settle(() => expect(requests).toHaveLength(1));

    const result = state.remove('goal-disparu');

    await expect(result).rejects.toBeInstanceOf(AppError);
    await expect(result).rejects.toMatchObject({
      code: 'GOAL_NOT_FOUND',
      userMessage: ERROR_MESSAGES['GOAL_NOT_FOUND'],
    });
    expect(requests).toHaveLength(1);
  });
});
