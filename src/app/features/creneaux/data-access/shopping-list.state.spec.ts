import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../mocks/api.testing';
import { shoppingListFixtures } from '../../../../mocks/fixtures/shopping-list.fixtures';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { ShoppingListState } from './shopping-list.state';

const RANGE = { from: '2026-03-16', to: '2026-03-22' };

function setup() {
  TestBed.configureTestingModule({ providers: [...apiTestProviders(), ShoppingListState] });
  return TestBed.inject(ShoppingListState);
}

describe('ShoppingListState', () => {
  it('calcule la liste de la période', async () => {
    const state = setup();

    await state.generate(RANGE);

    expect(state.range()).toEqual(RANGE);
    expect(state.items()).toHaveLength(shoppingListFixtures.length);
    expect(state.isLoading()).toBe(false);
    expect(state.isEmpty()).toBe(false);
  });

  it('expose l’erreur de l’API sans liste', async () => {
    server.use(http.get('*/api/shopping-list', () => new HttpResponse(null, { status: 500 })));
    const state = setup();

    await state.generate(RANGE);

    expect(state.error()).toBeInstanceOf(AppError);
    expect(state.items()).toEqual([]);
    expect(state.isEmpty()).toBe(false);
  });

  it('distingue une période sans repas d’une liste en erreur', async () => {
    server.use(http.get('*/api/shopping-list', () => HttpResponse.json([])));
    const state = setup();

    await state.generate(RANGE);

    expect(state.isEmpty()).toBe(true);
  });

  it('efface la liste et la période', async () => {
    const state = setup();
    await state.generate(RANGE);

    state.clear();

    expect(state.range()).toBeNull();
    expect(state.items()).toEqual([]);
  });

  it('ignore une réponse arrivée après l’effacement', async () => {
    const state = setup();
    const onRequest = vi.fn();
    server.use(
      http.get('*/api/shopping-list', async () => {
        onRequest();
        await new Promise((resolve) => setTimeout(resolve, 20));
        return HttpResponse.json(shoppingListFixtures);
      }),
    );

    const pending = state.generate(RANGE);
    state.clear();
    await pending;

    expect(onRequest).toHaveBeenCalled();
    expect(state.items()).toEqual([]);
    expect(state.range()).toBeNull();
  });
});
