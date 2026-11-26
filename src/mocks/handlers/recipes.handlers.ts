import { http, HttpResponse } from 'msw';
import type {
  RecipeApi,
  RecipeDetailApi,
  RecipeRequestApi,
} from '../../app/features/nutrition/models/recipe.api-model';
import { recipeDetailFixtures, recipesFixtures } from '../fixtures/recipes.fixtures';

let recipes: RecipeApi[] = structuredClone(recipesFixtures);
let details: RecipeDetailApi[] = structuredClone(recipeDetailFixtures);

/** Remet les recettes de test à leur état initial (appelé avant chaque test). */
export function resetRecipesMock(): void {
  recipes = structuredClone(recipesFixtures);
  details = structuredClone(recipeDetailFixtures);
}

const EMPTY_TOTALS = { calories: 0, proteins: 0, carbohydrates: 0, fats: 0, sugars: 0 };

function recipeNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:recipe-not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Recette introuvable.',
      instance: '/api/recipes',
      code: 'RECIPE_NOT_FOUND',
      correlationId: '7d4e2b1a-3c5f-4e9a-8b2d-1f6a9c0e4b73',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

function recipeImportDuplicate(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:recipe-import-duplicate',
      title: 'Conflict',
      status: 409,
      detail: 'Import refusé : une recette porte déjà ce nom.',
      instance: '/api/recipes/import',
      code: 'RECIPE_IMPORT_DUPLICATE',
      correlationId: '7d4e2b1a-3c5f-4e9a-8b2d-1f6a9c0e4b73',
      errors: [
        {
          field: 'recettes[0].name',
          code: 'RECIPE_IMPORT_DUPLICATE',
          message: 'une recette porte déjà ce nom',
        },
      ],
    },
    { status: 409, headers: { 'content-type': 'application/problem+json' } },
  );
}

/** Synthèse de test : les totaux réels sont calculés par le back ; le mock renvoie des zéros. */
function toDetail(recipe: RecipeApi): RecipeDetailApi {
  return {
    ...recipe,
    nutrition: { totals: EMPTY_TOTALS, byComponent: {}, ignored: [] },
  };
}

export const recipesHandlers = [
  http.get('*/api/recipes', () => HttpResponse.json(recipes)),
  http.get('*/api/recipes/:id', ({ params }) => {
    const detail = details.find((recipe) => recipe.id === String(params['id']));
    return detail ? HttpResponse.json(detail) : recipeNotFound();
  }),
  http.post('*/api/recipes', async ({ request }) => {
    const body = (await request.json()) as RecipeRequestApi;
    const created: RecipeApi = { id: crypto.randomUUID(), ...body };
    recipes = [...recipes, created];
    details = [...details, toDetail(created)];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.post('*/api/recipes/import', async ({ request }) => {
    const body = (await request.json()) as unknown;
    const items = (
      Array.isArray(body) ? body : ((body as { recettes?: RecipeRequestApi[] }).recettes ?? [])
    ) as RecipeRequestApi[];
    const names = new Set(recipes.map((recipe) => recipe.name.trim().toLowerCase()));
    if (items.some((item) => names.has(item.name.trim().toLowerCase()))) {
      return recipeImportDuplicate();
    }
    const created = items.map((item): RecipeApi => ({ id: crypto.randomUUID(), ...item }));
    recipes = [...recipes, ...created];
    details = [...details, ...created.map(toDetail)];
    return HttpResponse.json(
      { createdCount: created.length, ids: created.map((recipe) => recipe.id) },
      { status: 201 },
    );
  }),
  http.post('*/api/recipes/preview', () =>
    HttpResponse.json({ totals: EMPTY_TOTALS, ignored: [] }),
  ),
  http.patch('*/api/recipes/:id', async ({ params, request }) => {
    const id = String(params['id']);
    const current = recipes.find((recipe) => recipe.id === id);
    if (!current) {
      return recipeNotFound();
    }
    const body = (await request.json()) as RecipeRequestApi;
    const updated: RecipeApi = { ...current, ...body };
    recipes = recipes.map((recipe) => (recipe.id === id ? updated : recipe));
    details = details.map((recipe) => (recipe.id === id ? toDetail(updated) : recipe));
    return HttpResponse.json(updated);
  }),
  http.delete('*/api/recipes/:id', ({ params }) => {
    const id = String(params['id']);
    if (!recipes.some((recipe) => recipe.id === id)) {
      return recipeNotFound();
    }
    recipes = recipes.filter((recipe) => recipe.id !== id);
    details = details.filter((recipe) => recipe.id !== id);
    return new HttpResponse(null, { status: 204 });
  }),
];
