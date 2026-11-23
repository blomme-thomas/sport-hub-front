import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../mocks/api.testing';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { MealPlanState } from './meal-plan.state';

const WEEK = '2026-W12';
const RECIPE_ID = '9b1d2c3e-4f5a-4b6c-8d7e-0f1a2b3c4d01';

function setup() {
  TestBed.configureTestingModule({ providers: [...apiTestProviders(), MealPlanState] });
  return TestBed.inject(MealPlanState);
}

describe('MealPlanState', () => {
  it('charge les repas de la semaine et les range par case', async () => {
    const state = setup();

    await state.load(WEEK);

    expect(state.mealsAt('2026-03-17', 'midi')).toHaveLength(2);
    expect(state.mealsAt('2026-03-17', 'soir')).toEqual([]);
    expect(state.error()).toBeNull();
    expect(state.isLoading()).toBe(false);
  });

  it('ne renvoie aucun repas pour une semaine vide', async () => {
    const state = setup();

    await state.load('2026-W01');

    expect(state.meals()).toEqual([]);
  });

  it('expose l’erreur de l’API', async () => {
    server.use(http.get('*/api/meal-plan', () => new HttpResponse(null, { status: 500 })));
    const state = setup();

    await state.load(WEEK);

    expect(state.error()).toBeInstanceOf(AppError);
    expect(state.meals()).toEqual([]);
  });

  it('place une recette puis recharge la semaine', async () => {
    const state = setup();
    await state.load(WEEK);

    await state.place(RECIPE_ID, '2026-03-16', 'matin');

    expect(state.mealsAt('2026-03-16', 'matin')).toHaveLength(1);
    expect(state.mealsAt('2026-03-16', 'matin')[0]?.recipeId).toBe(RECIPE_ID);
  });

  it('retire un seul repas puis recharge la semaine', async () => {
    const state = setup();
    await state.load(WEEK);
    const [first] = state.mealsAt('2026-03-17', 'midi');

    await state.remove(first!.id);

    expect(state.mealsAt('2026-03-17', 'midi')).toHaveLength(1);
  });

  it('rejette une AppError quand le placement est refusé', async () => {
    server.use(
      http.post('*/api/meal-plan', () =>
        HttpResponse.json(
          {
            type: 'urn:sport-hub:problem:recipe-not-found',
            title: 'Not Found',
            status: 404,
            detail: 'Recette introuvable.',
            instance: '/api/meal-plan',
            code: 'RECIPE_NOT_FOUND',
            correlationId: 'c0',
          },
          { status: 404, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );
    const state = setup();
    const error = vi.fn();

    await state.place(RECIPE_ID, '2026-03-16', 'matin').catch(error);

    expect(error.mock.calls[0]?.[0]).toBeInstanceOf(AppError);
  });
});
