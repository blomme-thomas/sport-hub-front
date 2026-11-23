import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { TEXTS, fill } from '@shared/texts/texts';
import type {
  DateRange,
  ShoppingCategory,
  ShoppingListItem,
} from '../../models/shopping-list.model';
import {
  formatShoppingListText,
  groupByCategory,
  quantityText,
  type ShoppingTextLabels,
} from './shopping-list.format';

/** Date longue en français, ex. « lundi 23 novembre ». */
export function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

/**
 * Liste de courses d'une période, groupée par catégorie, avec ses quantités calculées par le back. Les lignes
 * sans quantité complète sont signalées. « Copier » émet le texte brut : l'écran le place dans le presse-papiers.
 */
@Component({
  selector: 'sh-shopping-list',
  imports: [NzButtonComponent],
  templateUrl: './shopping-list.component.html',
  styleUrl: './shopping-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingListComponent {
  readonly items = input.required<readonly ShoppingListItem[]>();
  readonly range = input.required<DateRange>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly copyRequested = output<string>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  protected readonly period = computed(() =>
    fill(this.t.creneaux.shopping.period, {
      from: formatLongDay(this.range().from),
      to: formatLongDay(this.range().to),
    }),
  );

  protected readonly groups = computed(() =>
    groupByCategory(this.items()).map((group) => ({
      category: group.category,
      label: this.categoryLabel(group.category),
      lines: group.items.map((item) => ({
        key: item.foodId,
        name: item.name,
        quantity: quantityText(item, this.labels()),
        missing: item.quantity === null || item.quantityMissing,
      })),
    })),
  );

  private readonly labels = computed<ShoppingTextLabels>(() => ({
    title: this.t.creneaux.shopping.title,
    categories: this.t.creneaux.shopping.categories,
    missing: this.t.creneaux.shopping.missing,
    empty: this.t.creneaux.shopping.noValue,
  }));

  protected categoryLabel(category: ShoppingCategory): string {
    return this.t.creneaux.shopping.categories[category];
  }

  protected copy(): void {
    this.copyRequested.emit(formatShoppingListText(this.items(), this.period(), this.labels()));
  }
}
