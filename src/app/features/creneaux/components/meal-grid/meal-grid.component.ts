import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';
import { MEAL_SLOTS, type MealSlot } from '../../models/meal-slot';
import type { PlannedMeal } from '../../models/planned-meal.model';
import type { DateRange } from '../../models/shopping-list.model';

/** Recette déposée dans une case : la grille ne fait que la signaler, l'écran l'enregistre. */
export interface PlacementRequest {
  recipeId: string;
  date: string;
  mealTag: MealSlot;
}

/** Type MIME utilisé pour transporter l'identifiant de la recette pendant le glisser-déposer. */
export const RECIPE_DRAG_TYPE = 'text/plain';

function formatShortDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

const cellKey = (date: string, meal: MealSlot): string => `${date}|${meal}`;

/**
 * Grille de la semaine en mode alimentation : mêmes jours que le calendrier des séances, trois lignes fixes
 * (matin, midi, soir), sans heures ni séances.
 * - Une recette glissée dans une case est signalée (`placed`) ; un clic sur une recette placée ouvre sa fiche
 *   (`mealSelected`). Le dépôt est désactivé quand `canDrop` est faux (mobile).
 * - Glisser sur les en-têtes des jours choisit une période (`rangeSelected`), sur ordinateur seulement.
 */
@Component({
  selector: 'sh-meal-grid',
  templateUrl: './meal-grid.component.html',
  styleUrl: './meal-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealGridComponent {
  /** Dates `YYYY-MM-DD` de la semaine affichée, du lundi au dimanche. */
  readonly dates = input.required<readonly string[]>();
  /** Repas planifiés de la semaine affichée. */
  readonly plannedMeals = input<readonly PlannedMeal[]>([]);
  /** Nom de chaque recette, par identifiant. */
  readonly recipeNames = input<ReadonlyMap<string, string>>(new Map());
  /** Vrai sur ordinateur : une recette peut être déposée et une période choisie. */
  readonly canDrop = input(false);
  /** Période déjà choisie, affichée en surbrillance. */
  readonly selectedRange = input<DateRange | null>(null);
  /** Repas prévus pour la recette en cours de glissement ; `null` hors glissement. Une case hors de ces repas n'accepte pas le dépôt. */
  readonly draggedMealTags = input<readonly MealSlot[] | null>(null);

  readonly placed = output<PlacementRequest>();
  readonly mealSelected = output<PlannedMeal>();
  /** Retrait direct d'un repas depuis sa carte, sans ouvrir la fiche. */
  readonly mealRemoveRequested = output<PlannedMeal>();
  readonly rangeSelected = output<DateRange>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly meals = MEAL_SLOTS;
  /** Case survolée pendant un glissement de recette, pour la mettre en évidence. */
  protected readonly hoveredCell = signal<string | null>(null);
  /** Premier jour d'une sélection en cours, et dernier jour atteint par le pointeur. */
  private readonly anchorDate = signal<string | null>(null);
  private readonly currentDate = signal<string | null>(null);

  private readonly cells = computed(() => {
    const byCell = new Map<string, PlannedMeal[]>();
    for (const meal of this.plannedMeals()) {
      const key = cellKey(meal.date, meal.mealTag);
      byCell.set(key, [...(byCell.get(key) ?? []), meal]);
    }
    return byCell;
  });

  /** Période en cours de sélection, ou la période choisie si aucune sélection n'est en cours. */
  private readonly activeRange = computed<DateRange | null>(() => {
    const anchor = this.anchorDate();
    const current = this.currentDate();
    if (anchor !== null && current !== null) {
      return anchor <= current ? { from: anchor, to: current } : { from: current, to: anchor };
    }
    return this.selectedRange();
  });

  protected dayLabel(date: string): string {
    return formatShortDay(date);
  }

  protected mealLabel(meal: MealSlot): string {
    return this.t.creneaux.meals[meal];
  }

  protected cellLabel(meal: MealSlot, date: string): string {
    return fill(this.t.creneaux.meals.cell, {
      meal: this.mealLabel(meal),
      date: formatLongDay(date),
    });
  }

  protected mealsIn(date: string, meal: MealSlot): readonly PlannedMeal[] {
    return this.cells().get(cellKey(date, meal)) ?? [];
  }

  protected nameOf(recipeId: string): string {
    return this.recipeNames().get(recipeId) ?? this.t.creneaux.placed.unknownRecipe;
  }

  protected isHovered(date: string, meal: MealSlot): boolean {
    return this.hoveredCell() === cellKey(date, meal);
  }

  protected isInRange(date: string): boolean {
    const range = this.activeRange();
    return range !== null && date >= range.from && date <= range.to;
  }

  /** Vrai si la case accepte la recette en cours de glissement (toutes, hors glissement). */
  private acceptsDragged(meal: MealSlot): boolean {
    const allowed = this.draggedMealTags();
    return allowed === null || allowed.includes(meal);
  }

  protected onDragOver(event: DragEvent, date: string, meal: MealSlot): void {
    if (!this.canDrop() || !this.acceptsDragged(meal)) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.hoveredCell.set(cellKey(date, meal));
  }

  protected onDragLeave(date: string, meal: MealSlot): void {
    if (this.isHovered(date, meal)) {
      this.hoveredCell.set(null);
    }
  }

  protected onDrop(event: DragEvent, date: string, meal: MealSlot): void {
    this.hoveredCell.set(null);
    if (!this.canDrop() || !this.acceptsDragged(meal)) {
      return;
    }
    event.preventDefault();
    const recipeId = event.dataTransfer?.getData(RECIPE_DRAG_TYPE) ?? '';
    if (recipeId !== '') {
      this.placed.emit({ recipeId, date, mealTag: meal });
    }
  }

  /** Début d'une sélection de période sur un en-tête de jour (bouton principal seulement). */
  protected startRange(event: PointerEvent, date: string): void {
    if (!this.canDrop() || event.button > 0) {
      return;
    }
    this.anchorDate.set(date);
    this.currentDate.set(date);
  }

  protected extendRange(date: string): void {
    if (this.anchorDate() !== null) {
      this.currentDate.set(date);
    }
  }

  @HostListener('document:pointerup')
  protected endRange(): void {
    if (this.anchorDate() === null) {
      return;
    }
    const range = this.activeRange();
    this.anchorDate.set(null);
    this.currentDate.set(null);
    if (range !== null) {
      this.rangeSelected.emit(range);
    }
  }
}
