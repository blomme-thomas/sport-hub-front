/** Réponse de `POST /api/foods/import` et `POST /api/recipes/import` : nombre créé et identifiants créés. */
export interface PlanImportResultApi {
  createdCount: number;
  ids: string[];
}
