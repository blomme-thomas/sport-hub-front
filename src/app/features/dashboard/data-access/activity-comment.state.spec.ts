import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import {
  ACTIVITY_ID,
  activityCommentApi,
} from '../../../../mocks/fixtures/activity-comment.fixtures';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { ActivityCommentApiService } from './activity-comment.api';
import { ActivityCommentState } from './activity-comment.state';

const COMMENT_URL = '*/api/activities/:id/comment';

function setup(): ActivityCommentState {
  TestBed.configureTestingModule({
    providers: [...statsTestProviders(), ActivityCommentApiService, ActivityCommentState],
  });
  const state = TestBed.inject(ActivityCommentState);
  state.select(ACTIVITY_ID);
  return state;
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('ActivityCommentState', () => {
  it('charge le commentaire stocké de l’activité', async () => {
    server.use(http.get(COMMENT_URL, () => HttpResponse.json(activityCommentApi)));

    const state = setup();

    await settle(() => expect(state.comment()).not.toBeNull());
    expect(state.comment()?.text).toBe(activityCommentApi.text);
    expect(state.errorMessage()).toBeNull();
  });

  it('traite une activité sans commentaire (404) comme un état à proposer, pas comme une erreur', async () => {
    server.use(http.get(COMMENT_URL, () => new HttpResponse(null, { status: 404 })));

    const state = setup();

    await settle(() => expect(state.loading()).toBe(false));
    expect(state.comment()).toBeNull();
    expect(state.errorMessage()).toBeNull();
  });

  it('génère le commentaire et l’affiche sans recharger', async () => {
    let posted = false;
    server.use(
      http.get(COMMENT_URL, () => new HttpResponse(null, { status: 404 })),
      http.post(COMMENT_URL, () => {
        posted = true;
        return HttpResponse.json(activityCommentApi, { status: 201 });
      }),
    );
    const state = setup();
    await settle(() => expect(state.loading()).toBe(false));

    await state.generate();

    expect(posted).toBe(true);
    expect(state.comment()?.text).toBe(activityCommentApi.text);
    expect(state.generating()).toBe(false);
  });

  it('expose l’erreur de génération sans perdre l’état', async () => {
    server.use(
      http.get(COMMENT_URL, () => new HttpResponse(null, { status: 404 })),
      http.post(COMMENT_URL, () => new HttpResponse(null, { status: 503 })),
    );
    const state = setup();
    await settle(() => expect(state.loading()).toBe(false));

    await state.generate();

    expect(state.comment()).toBeNull();
    expect(state.errorMessage()).not.toBeNull();
    expect(state.generating()).toBe(false);
  });
});
