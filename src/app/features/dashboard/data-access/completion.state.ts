import { Injectable, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CompletionApi } from './completion.api';
import {
  type CompletionOccurrence,
  type CompletionView,
  toCompletionView,
} from './completion.mapper';
import { DashboardKpisState } from './dashboard-kpis.state';

interface DateRange {
  from: string;
  to: string;
}

/**
 * Complétion des séances de la période choisie. La plage est celle du bandeau d'indicateurs (fenêtre glissante
 * qui se termine aujourd'hui), donc elle suit le sélecteur de période. Fourni au niveau de la page.
 */
@Injectable()
export class CompletionState {
  private readonly api = inject(CompletionApi);
  private readonly kpis = inject(DashboardKpisState);

  private readonly range = computed<DateRange | undefined>(() => {
    const raw = this.kpis.raw();
    return raw ? { from: raw.from, to: raw.to } : undefined;
  });

  private readonly response = resource<CompletionOccurrence[], DateRange | undefined>({
    params: () => this.range(),
    loader: ({ params }) =>
      params ? firstValueFrom(this.api.list(params.from, params.to)) : Promise.resolve([]),
  });

  /** Vue de la carte ; `undefined` tant que la plage ou les séances ne sont pas reçues. */
  readonly view = computed<CompletionView | undefined>(() =>
    this.response.hasValue() ? toCompletionView(this.response.value(), todayIso()) : undefined,
  );

  readonly isLoading = computed(() => this.response.isLoading());

  reload(): void {
    this.response.reload();
  }
}

/** Jour courant en UTC, comme le reste du tableau de bord (`YYYY-MM-DD`). */
function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
