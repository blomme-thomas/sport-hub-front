import { http, HttpResponse } from 'msw';
import { recipeDetailFixtures, recipesFixtures } from '../fixtures/recipes.fixtures';

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

export const recipesHandlers = [
  http.get('*/api/recipes', () => HttpResponse.json(recipesFixtures)),
  http.get('*/api/recipes/:id', ({ params }) => {
    const detail = recipeDetailFixtures.find((recipe) => recipe.id === String(params['id']));
    return detail ? HttpResponse.json(detail) : recipeNotFound();
  }),
];
