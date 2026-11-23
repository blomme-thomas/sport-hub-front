import { TestBed } from '@angular/core/testing';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { apiTestProviders } from '../../../../mocks/api.testing';
import { server } from '../../../../mocks/server';
import { AppError } from '../../../core/http/app-error';
import { FoodsState } from './foods.state';

async function setup() {
  TestBed.configureTestingModule({ providers: [...apiTestProviders(), FoodsState] });
  const state = TestBed.inject(FoodsState);
  await vi.waitFor(() => expect(state.isLoading()).toBe(false));
  return state;
}

describe('FoodsState', () => {
  it('charge la base et compte les aliments par catégorie', async () => {
    const state = await setup();

    expect(state.total()).toBe(6);
    expect(state.counts()).toEqual({ proteine: 3, legume: 1, feculent: 2, autre: 1 });
    expect(state.isEmpty()).toBe(false);
    expect(state.error()).toBeNull();
  });

  it('applique la recherche et la catégorie sans changer les compteurs', async () => {
    const state = await setup();

    state.setSearch('ri');
    state.selectCategory('feculent');

    expect(state.visible().map((food) => food.name)).toEqual(['Riz cuit']);
    expect(state.counts().feculent).toBe(2);
  });

  it('expose l’erreur de l’API et une base vide qui n’est pas une erreur', async () => {
    server.use(http.get('*/api/foods', () => new HttpResponse(null, { status: 500 })));
    TestBed.configureTestingModule({ providers: [...apiTestProviders(), FoodsState] });
    const state = TestBed.inject(FoodsState);

    await vi.waitFor(() => expect(state.error()).toBeInstanceOf(AppError));
    expect(state.isEmpty()).toBe(false);
    expect(state.visible()).toEqual([]);
  });

  it('rejette une AppError quand la modification est refusée, sans recharger la base', async () => {
    const state = await setup();
    const id = state.visible()[0]!.id;
    server.use(
      http.patch('*/api/foods/:id', () =>
        HttpResponse.json(
          {
            type: 'urn:sport-hub:problem:validation',
            title: 'Bad Request',
            status: 400,
            detail: 'Requête invalide.',
            instance: '/api/foods',
            code: 'VALIDATION_FAILED',
            correlationId: '7d4e2b1a-3c5f-4e9a-8b2d-1f6a9c0e4b73',
          },
          { status: 400, headers: { 'content-type': 'application/problem+json' } },
        ),
      ),
    );

    await expect(
      state.update(id, {
        name: 'X',
        unit: 'g',
        categories: ['autre'],
        calories: null,
        proteins: null,
        carbohydrates: null,
        fats: null,
        sugars: null,
      }),
    ).rejects.toBeInstanceOf(AppError);
    expect(state.saving()).toBe(false);
  });

  it('recharge la base après une création réussie', async () => {
    const state = await setup();

    await state.create({
      name: 'Quinoa cuit',
      unit: 'g',
      categories: ['feculent'],
      calories: 120,
      proteins: 4.4,
      carbohydrates: 21.3,
      fats: 1.9,
      sugars: 0.9,
    });

    expect(state.total()).toBe(7);
    expect(state.counts().feculent).toBe(3);
  });
});
