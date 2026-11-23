import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TEXTS, fill } from '@shared/texts/texts';

/** Repas affichés, du haut vers le bas. Le mode alimentation n'a pas d'heures. */
const MEALS = ['matin', 'midi', 'soir'] as const;
type Meal = (typeof MEALS)[number];

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

/**
 * Grille de la semaine en mode alimentation : mêmes jours que le calendrier des séances, trois lignes fixes
 * (matin, midi, soir), sans heures ni séances. Les repas placés dans les cases arrivent avec la story #160.
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

  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly meals = MEALS;

  protected dayLabel(date: string): string {
    return formatShortDay(date);
  }

  protected mealLabel(meal: Meal): string {
    return this.t.creneaux.meals[meal];
  }

  protected cellLabel(meal: Meal, date: string): string {
    return fill(this.t.creneaux.meals.cell, {
      meal: this.mealLabel(meal),
      date: formatLongDay(date),
    });
  }
}
