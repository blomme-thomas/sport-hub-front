// Squelette — à copier dans features/<feature>/pages/<name>.page.ts (+ .html) puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/02-components.instructions.md, 03, 04
//
// Page = composant routé (smart) : injecte l'état, délègue l'affichage aux composants de présentation.

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
// import { ExampleState } from '../data-access/example.state';
// import { ExampleCardComponent } from '../components/example-card.component';

@Component({
  selector: 'sh-example-page',
  // imports: [ExampleCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Fournir l'état au niveau de la page/route pour limiter sa durée de vie :
  // providers: [ExampleState],
  template: `
    @if (state.loading()) {
      <p role="status">Chargement…</p>
    } @else if (state.error()) {
      <p role="alert">Impossible de charger les données.</p>
    } @else {
      @for (item of state.items(); track item.id) {
        <!-- <sh-example-card [item]="item" (selected)="onSelect(item.id)" /> -->
        <p>{{ item.label }}</p>
      } @empty {
        <p>Aucune donnée.</p>
      }
    }
  `,
})
export class ExamplePage {
  // Paramètre de route lié via withComponentInputBinding()
  readonly id = input<string>();

  // protected pour le template, readonly pour l'immutabilité de la référence
  protected readonly state = {
    loading: computed(() => false),
    error: computed(() => false),
    items: computed(() => [{ id: '1', label: 'exemple' }]),
  }; // → remplacer par : protected readonly state = inject(ExampleState);

  protected onSelect(id: string): void {
    // déléguer à l'état / au routeur, pas de logique métier ici
    void id;
  }
}
