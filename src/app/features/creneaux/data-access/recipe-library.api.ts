import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  LibraryFoodApi,
  LibraryRecipeApi,
  LibraryRecipeDetailApi,
} from '../models/library-recipe.api-model';
import type { LibraryRecipe, RecipeTotals } from '../models/library-recipe.model';

/** Aliment tel que lu par le calendrier : nom et unité, pour afficher la composition. */
export interface LibraryFood {
  id: string;
  name: string;
  unit: string;
}

/** Composition d'une recette : totaux du back et lignes (identifiant d'aliment, quantité). */
export interface LibraryRecipeComposition {
  totals: RecipeTotals;
  items: { foodId: string; quantity: number | null }[];
}

/**
 * Accès HTTP aux recettes, côté calendrier : la bibliothèque à placer et la fiche d'une recette placée.
 * Le calendrier ne lit que ces éléments de la ressource « recettes » ; la gestion des recettes est dans nutrition.
 */
@Injectable({ providedIn: 'root' })
export class RecipeLibraryApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<LibraryRecipe[]> {
    return this.http
      .get<LibraryRecipeApi[]>(`${this.baseUrl}/recipes`)
      .pipe(
        map((items) =>
          items.map((item) => ({ id: item.id, name: item.name, mealTags: [...item.mealTags] })),
        ),
      );
  }

  composition(id: string): Observable<LibraryRecipeComposition> {
    return this.http
      .get<LibraryRecipeDetailApi>(`${this.baseUrl}/recipes/${encodeURIComponent(id)}`)
      .pipe(
        map((detail) => ({
          totals: { ...detail.nutrition.totals },
          items: detail.items.map((item) => ({ foodId: item.foodId, quantity: item.quantity })),
        })),
      );
  }

  foods(): Observable<LibraryFood[]> {
    return this.http
      .get<LibraryFoodApi[]>(`${this.baseUrl}/foods`)
      .pipe(
        map((items) => items.map((item) => ({ id: item.id, name: item.name, unit: item.unit }))),
      );
  }
}
