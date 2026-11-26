import { http, HttpResponse } from 'msw';
import type { FoodApi, FoodRequestApi } from '../../app/features/nutrition/models/food.api-model';
import { foodsFixtures } from '../fixtures/foods.fixtures';

let foods: FoodApi[] = structuredClone(foodsFixtures);

/** Remet la base d'aliments de test à son état initial (appelé avant chaque test). */
export function resetFoodsMock(): void {
  foods = structuredClone(foodsFixtures);
}

function foodNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:food-not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Aliment introuvable.',
      instance: '/api/foods',
      code: 'FOOD_NOT_FOUND',
      correlationId: '7d4e2b1a-3c5f-4e9a-8b2d-1f6a9c0e4b73',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

function foodImportDuplicate(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:food-import-duplicate',
      title: 'Conflict',
      status: 409,
      detail: 'Import refusé : un aliment porte déjà ce nom.',
      instance: '/api/foods/import',
      code: 'FOOD_IMPORT_DUPLICATE',
      correlationId: '7d4e2b1a-3c5f-4e9a-8b2d-1f6a9c0e4b73',
      errors: [
        {
          field: 'aliments[0].name',
          code: 'FOOD_IMPORT_DUPLICATE',
          message: 'un aliment porte déjà ce nom',
        },
      ],
    },
    { status: 409, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const foodsHandlers = [
  http.post('*/api/foods/import', async ({ request }) => {
    const body = (await request.json()) as unknown;
    const items = (
      Array.isArray(body) ? body : ((body as { aliments?: FoodRequestApi[] }).aliments ?? [])
    ) as FoodRequestApi[];
    const names = new Set(foods.map((food) => food.name.trim().toLowerCase()));
    if (items.some((item) => names.has(item.name.trim().toLowerCase()))) {
      return foodImportDuplicate();
    }
    const created = items.map((item): FoodApi => ({ id: crypto.randomUUID(), ...item }));
    foods = [...foods, ...created];
    return HttpResponse.json(
      { createdCount: created.length, ids: created.map((food) => food.id) },
      { status: 201 },
    );
  }),
  http.get('*/api/foods', () => HttpResponse.json(foods)),
  http.post('*/api/foods', async ({ request }) => {
    const body = (await request.json()) as FoodRequestApi;
    const created: FoodApi = { id: crypto.randomUUID(), ...body };
    foods = [...foods, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.patch('*/api/foods/:id', async ({ params, request }) => {
    const id = String(params['id']);
    const current = foods.find((food) => food.id === id);
    if (!current) {
      return foodNotFound();
    }
    const body = (await request.json()) as FoodRequestApi;
    const updated: FoodApi = { ...current, ...body };
    foods = foods.map((food) => (food.id === id ? updated : food));
    return HttpResponse.json(updated);
  }),
];
