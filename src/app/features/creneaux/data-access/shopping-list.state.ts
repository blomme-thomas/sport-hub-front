import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { DateRange, ShoppingListItem } from '../models/shopping-list.model';
import { ShoppingListApi } from './shopping-list.api';

/**
 * Liste de courses de la période choisie. Rien n'est sauvegardé : chaque génération interroge le back, et la
 * réponse la plus récente est la seule retenue. Fourni au niveau de la page.
 */
@Injectable()
export class ShoppingListState {
  private readonly api = inject(ShoppingListApi);
  private readonly rangeValue = signal<DateRange | null>(null);
  private readonly itemsValue = signal<readonly ShoppingListItem[]>([]);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private requestId = 0;

  readonly range = this.rangeValue.asReadonly();
  readonly items = this.itemsValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly isEmpty = computed(
    () => !this.loadingValue() && this.errorValue() === null && this.itemsValue().length === 0,
  );

  async generate(range: DateRange): Promise<void> {
    const id = ++this.requestId;
    this.rangeValue.set(range);
    this.loadingValue.set(true);
    this.errorValue.set(null);
    this.itemsValue.set([]);
    try {
      const items = await firstValueFrom(this.api.get(range));
      if (id === this.requestId) {
        this.itemsValue.set(items);
      }
    } catch (error) {
      if (id === this.requestId) {
        this.errorValue.set(error instanceof AppError ? error : toAppError(error));
      }
    } finally {
      if (id === this.requestId) {
        this.loadingValue.set(false);
      }
    }
  }

  /** Efface la liste et la période ; une réponse encore en route est ignorée. */
  clear(): void {
    this.requestId++;
    this.rangeValue.set(null);
    this.itemsValue.set([]);
    this.loadingValue.set(false);
    this.errorValue.set(null);
  }
}
