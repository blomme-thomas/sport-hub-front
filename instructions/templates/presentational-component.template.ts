// Squelette — à copier dans features/<feature>/components/<name>.component.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/02-components.instructions.md
//
// Composant de présentation : aucune injection de service de données, uniquement input()/output().

import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

export interface ExampleItem {
  id: string;
  label: string;
  distanceKm: number;
}

@Component({
  selector: 'sh-example-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'example-card' }, // à la place de @HostBinding
  template: `
    <article>
      <h3>{{ item().label }}</h3>
      <p>{{ distanceLabel() }}</p>
      <button type="button" (click)="selected.emit(item().id)">Ouvrir</button>
    </article>
  `,
  styles: `
    :host { display: block; }
  `,
})
export class ExampleCardComponent {
  readonly item = input.required<ExampleItem>();
  readonly selected = output<string>();

  protected readonly distanceLabel = computed(() => `${this.item().distanceKm.toFixed(1)} km`);
}
