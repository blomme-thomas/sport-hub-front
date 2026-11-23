import { http, HttpResponse } from 'msw';
import type {
  CreatePlannedMealRequestApi,
  PlannedMealApi,
} from '../../app/features/creneaux/models/planned-meal.api-model';
import { isoWeekOf } from '../../app/shared/utils/iso-week';
import { mealPlanFixtures } from '../fixtures/meal-plan.fixtures';

let meals: PlannedMealApi[] = structuredClone(mealPlanFixtures);

/** Remet les repas planifiés de test à leur état initial (appelé avant chaque test). */
export function resetMealPlanMock(): void {
  meals = structuredClone(mealPlanFixtures);
}

export const mealPlanHandlers = [
  http.get('*/api/meal-plan', ({ request }) => {
    const week = new URL(request.url).searchParams.get('week') ?? '';
    return HttpResponse.json(meals.filter((meal) => isoWeekOf(meal.date) === week));
  }),
  http.post('*/api/meal-plan', async ({ request }) => {
    const body = (await request.json()) as CreatePlannedMealRequestApi;
    const created: PlannedMealApi = { id: crypto.randomUUID(), ...body };
    meals = [...meals, created];
    return HttpResponse.json(created, { status: 201 });
  }),
  http.delete('*/api/meal-plan/:id', ({ params }) => {
    meals = meals.filter((meal) => meal.id !== String(params['id']));
    return new HttpResponse(null, { status: 204 });
  }),
];
