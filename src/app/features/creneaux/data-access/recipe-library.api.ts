import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { LibraryRecipeApi, LibraryRecipeDetailApi } from '../models/library-recipe.api-model';
import type { LibraryRecipe, RecipeTotals } from '../models/library-recipe.model';

/**
 * Accès HTTP aux recettes, côté calendrier : la bibliothèque à placer et les totaux d'une recette consultée.
 * Le calendrier ne lit que ces deux éléments de la ressource « recettes » ; la gestion des recettes est dans nutrition.
 */
@Injectable({ providedIn: 'root' })
export class RecipeLibraryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LibraryRecipe[]> {
    return this.http
      .get<LibraryRecipeApi[]>(`${this.baseUrl}/recipes`)
      .pipe(map((items) => items.map((item) => ({ id: item.id, name: item.name }))));
  }

  totals(id: string): Observable<RecipeTotals> {
    return this.http
      .get<LibraryRecipeDetailApi>(`${this.baseUrl}/recipes/${encodeURIComponent(id)}`)
      .pipe(map((detail) => ({ ...detail.nutrition.totals })));
  }
}
