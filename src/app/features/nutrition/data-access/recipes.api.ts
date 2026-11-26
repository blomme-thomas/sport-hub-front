import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  RecipeApi,
  RecipeDetailApi,
  RecipePreviewApi,
  RecipePreviewRequestApi,
  RecipeRequestApi,
} from '../models/recipe.api-model';
import type { PlanImportResultApi } from '../models/plan-import.api-model';
import type { Recipe, RecipeDetail, RecipePreview } from '../models/recipe.model';
import { toRecipe, toRecipeDetail, toRecipePreview } from './recipe.mapper';

/** Accès HTTP aux recettes ; les réponses sont mappées en modèle UI, les erreurs remontent telles quelles. */
@Injectable({ providedIn: 'root' })
export class RecipesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Recettes triées par nom, sans synthèse nutritionnelle. */
  list(): Observable<Recipe[]> {
    return this.http
      .get<RecipeApi[]>(`${this.baseUrl}/recipes`)
      .pipe(map((items) => items.map(toRecipe)));
  }

  /** Une recette et sa synthèse nutritionnelle calculée par le back. */
  get(id: string): Observable<RecipeDetail> {
    return this.http
      .get<RecipeDetailApi>(`${this.baseUrl}/recipes/${encodeURIComponent(id)}`)
      .pipe(map(toRecipeDetail));
  }

  create(body: RecipeRequestApi): Observable<Recipe> {
    return this.http.post<RecipeApi>(`${this.baseUrl}/recipes`, body).pipe(map(toRecipe));
  }

  update(id: string, body: RecipeRequestApi): Observable<Recipe> {
    return this.http
      .patch<RecipeApi>(`${this.baseUrl}/recipes/${encodeURIComponent(id)}`, body)
      .pipe(map(toRecipe));
  }

  /** Synthèse d'une composition non enregistrée, calculée par le back (aperçu en direct). */
  preview(body: RecipePreviewRequestApi): Observable<RecipePreview> {
    return this.http
      .post<RecipePreviewApi>(`${this.baseUrl}/recipes/preview`, body)
      .pipe(map(toRecipePreview));
  }

  /** Supprime une recette. Sans `confirm`, le back refuse (409 `RECIPE_IN_USE`) une recette planifiée. */
  delete(id: string, confirm: boolean): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/recipes/${encodeURIComponent(id)}`, {
      params: confirm ? { confirm: 'true' } : {},
    });
  }

  /** Importe un fichier `plan-recettes` (ou un tableau brut) : toutes les recettes sont créées, ou aucune. */
  importRecipes(content: unknown): Observable<PlanImportResultApi> {
    return this.http.post<PlanImportResultApi>(`${this.baseUrl}/recipes/import`, content);
  }
}
