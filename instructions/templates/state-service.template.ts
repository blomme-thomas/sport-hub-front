// Squelette — à copier dans features/<feature>/data-access/<name>.state.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/03-state-and-signals.instructions.md
//
// État en signals : écriture privée, lecture publique en readonly/computed, mutations par méthodes nommées.

import { Injectable, computed, signal } from '@angular/core';

interface Item { id: string; label: string }
interface ExampleStateShape {
  filter: string;
  items: Item[];
  loading: boolean;
  error: string | null;
}

@Injectable() // fournir via les providers de la route/page ; providedIn:'root' seulement si réellement global
export class ExampleState {
  private readonly state = signal<ExampleStateShape>({ filter: '', items: [], loading: false, error: null });

  // Lecture
  readonly items = computed(() => this.state().items);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly filtered = computed(() => {
    const { items, filter } = this.state();
    return filter ? items.filter((i) => i.label.includes(filter)) : items;
  });

  // Mutations nommées (immuables)
  setFilter(filter: string): void {
    this.state.update((s) => ({ ...s, filter }));
  }

  setItems(items: Item[]): void {
    this.state.update((s) => ({ ...s, items, loading: false, error: null }));
  }

  setError(error: string): void {
    this.state.update((s) => ({ ...s, error, loading: false }));
  }
}
