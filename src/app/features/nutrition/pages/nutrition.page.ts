import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';
import { FoodsPanelComponent } from '../components/foods-panel/foods-panel.component';
import { RecipesPanelComponent } from '../components/recipes-panel/recipes-panel.component';

/** Onglets de la page Nutrition. La clé `onglet` de l'URL restaure l'onglet choisi au rechargement. */
export const NUTRITION_TABS = ['recettes', 'aliments'] as const;
export type NutritionTab = (typeof NUTRITION_TABS)[number];

const TAB_QUERY_PARAM = 'onglet';
const DEFAULT_TAB: NutritionTab = 'recettes';

function tabFromQuery(value: string | null): NutritionTab {
  return (NUTRITION_TABS as readonly string[]).includes(value ?? '')
    ? (value as NutritionTab)
    : DEFAULT_TAB;
}

/** Page Nutrition : deux onglets, « Mes recettes » et « Mes aliments ». */
@Component({
  selector: 'sh-nutrition-page',
  imports: [FoodsPanelComponent, RecipesPanelComponent],
  templateUrl: './nutrition.page.html',
  styleUrl: './nutrition.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NutritionPage {
  protected readonly t = TEXTS;
  protected readonly tabs = NUTRITION_TABS;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly selected = signal<NutritionTab>(
    tabFromQuery(this.route.snapshot.queryParamMap.get(TAB_QUERY_PARAM)),
  );

  protected labelOf(tab: NutritionTab): string {
    return tab === 'recettes' ? this.t.nutrition.tabs.recipes : this.t.nutrition.tabs.foods;
  }

  protected select(tab: NutritionTab): void {
    this.selected.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [TAB_QUERY_PARAM]: tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** Flèches gauche et droite (avec retour en boucle) et touches Début et Fin, comme le motif des onglets ARIA. */
  protected onKeydown(event: KeyboardEvent): void {
    const current = this.tabs.indexOf(this.selected());
    const last = this.tabs.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight') {
      next = current === last ? 0 : current + 1;
    } else if (event.key === 'ArrowLeft') {
      next = current === 0 ? last : current - 1;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = last;
    }
    if (next === null) {
      return;
    }
    event.preventDefault();
    this.select(this.tabs[next]);
    document.getElementById(`nutrition-tab-${this.tabs[next]}`)?.focus();
  }
}
