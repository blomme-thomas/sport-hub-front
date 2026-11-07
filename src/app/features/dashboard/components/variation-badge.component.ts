import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { VariationDirection, VariationView } from '../models/training-stats.model';

const ICONS: Record<VariationDirection, string> = {
  up: '▲',
  down: '▼',
  flat: '■',
  unknown: '–',
};

@Component({
  selector: 'sh-variation-badge',
  template: `
    <span
      class="variation-badge"
      [class]="'variation-badge variation-badge--' + variation().direction"
    >
      <span class="variation-badge__icon" aria-hidden="true">{{ icon() }}</span>
      <span class="variation-badge__text">{{ variation().text }}</span>
      <span class="variation-badge__label">{{ variation().label }}</span>
    </span>
  `,
  styles: `
    :host {
      display: inline-block;
    }

    .variation-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.15rem 0.6rem;
      border: 1px solid currentColor;
      border-radius: 999px;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .variation-badge__label {
      font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariationBadgeComponent {
  readonly variation = input.required<VariationView>();

  protected readonly icon = computed(() => ICONS[this.variation().direction]);
}
