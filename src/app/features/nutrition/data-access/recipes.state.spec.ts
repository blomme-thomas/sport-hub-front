import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../mocks/api.testing';
import { recipesFixtures } from '../../../../mocks/fixtures/recipes.fixtures';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { RecipesState } from './recipes.state';

async function setup() {
  TestBed.configureTestingModule({ providers: [...apiTestProviders(), RecipesState] });
  const state = TestBed.inject(RecipesState);
  await vi.waitFor(() => expect(state.isLoading()).toBe(false));
  return state;
}

describe('RecipesState', () => {
  it('charge les recettes avec leur synthèse et la base d’aliments', async () => {
    const state = await setup();

    expect(state.total()).toBe(3);
    expect(state.detailOf(recipesFixtures[0]!.id)?.totals.calories).toBe(437.5);
    expect(state.foodsById().size).toBe(6);
    expect(state.error()).toBeNull();
    expect(state.isEmpty()).toBe(false);
  });

  it('applique la recherche et le repas, sans changer les compteurs', async () => {
    const state = await setup();

    state.setSearch('riz');
    state.selectMealTag('midi');

    expect(state.visible().map((recipe) => recipe.name)).toEqual(['Poulet riz légumes']);
    expect(state.counts()).toEqual({ matin: 0, midi: 2, soir: 2 });
  });

  it('expose l’erreur de l’API', async () => {
    server.use(http.get('*/api/recipes', () => new HttpResponse(null, { status: 500 })));
    TestBed.configureTestingModule({ providers: [...apiTestProviders(), RecipesState] });
    const state = TestBed.inject(RecipesState);

    await vi.waitFor(() => expect(state.error()).toBeInstanceOf(AppError));
    expect(state.isEmpty()).toBe(false);
    expect(state.visible()).toEqual([]);
  });

  it('distingue une base de recettes vide d’une recherche sans résultat', async () => {
    server.use(http.get('*/api/recipes', () => HttpResponse.json([])));
    TestBed.configureTestingModule({ providers: [...apiTestProviders(), RecipesState] });
    const state = TestBed.inject(RecipesState);

    await vi.waitFor(() => expect(state.isLoading()).toBe(false));
    expect(state.isEmpty()).toBe(true);
    expect(state.visible()).toEqual([]);
  });
});
