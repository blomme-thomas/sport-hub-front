import { TestBed } from '@angular/core/testing';
import { HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  semiPastApi,
  triathlonApi,
  volumeUndatedApi,
} from '../../../../mocks/fixtures/goals.fixtures';
import {
  goalsTestProviders,
  problemResponse,
  trackGoalsList,
} from '../../../../mocks/goals.testing';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import { NextEventApi } from './next-event.api';
import { NextEventState } from './next-event.state';

function setup(): NextEventState {
  TestBed.configureTestingModule({
    providers: [...goalsTestProviders(), NextEventApi, NextEventState],
  });
  return TestBed.inject(NextEventState);
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('NextEventState', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-30T10:00:00Z') });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fige le jour de référence en UTC à la création', () => {
    const state = setup();

    expect(state.today()).toBe('2026-11-30');
  });

  it('expose le prochain événement à venir une fois la liste chargée', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [semiPastApi, triathlonApi] }));
    const state = setup();

    await settle(() => expect(state.event()).not.toBeUndefined());

    expect(state.event()?.title).toBe('Triathlon de Paris');
    expect(state.error()).toBeNull();
  });

  it('expose undefined pendant le chargement puis l état de chargement se termine', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const requests = trackGoalsList(async () => {
      await gate;
      return HttpResponse.json({ items: [triathlonApi] });
    });
    const state = setup();

    await settle(() => expect(requests).toHaveLength(1));

    expect(state.isLoading()).toBe(true);
    expect(state.event()).toBeUndefined();

    release();

    await settle(() => expect(state.isLoading()).toBe(false));
    expect(state.event()?.id).toBe(triathlonApi.id);
  });

  it('expose null quand aucun événement n est à venir', async () => {
    trackGoalsList(() => HttpResponse.json({ items: [semiPastApi, volumeUndatedApi] }));
    const state = setup();

    await settle(() => expect(state.event()).toBeNull());

    expect(state.error()).toBeNull();
  });

  it('expose une AppError et pas d événement quand l API renvoie une erreur', async () => {
    trackGoalsList(() => problemResponse(500, 'INTERNAL_ERROR'));
    const state = setup();

    await settle(() => expect(state.error()).not.toBeNull());

    expect(state.error()).toBeInstanceOf(AppError);
    expect(state.error()?.code).toBe('INTERNAL_ERROR');
    expect(state.error()?.userMessage).toContain(ERROR_MESSAGES['INTERNAL_ERROR']);
    expect(state.event()).toBeUndefined();
    expect(state.isLoading()).toBe(false);
  });

  it('relance la requête au rechargement après une erreur et efface l erreur', async () => {
    let calls = 0;
    trackGoalsList(() => {
      calls += 1;
      return calls === 1
        ? problemResponse(500, 'INTERNAL_ERROR')
        : HttpResponse.json({ items: [triathlonApi] });
    });
    const state = setup();
    await settle(() => expect(state.error()).not.toBeNull());

    state.reload();

    await settle(() => expect(state.event()?.id).toBe(triathlonApi.id));
    expect(state.error()).toBeNull();
    expect(calls).toBe(2);
  });
});
