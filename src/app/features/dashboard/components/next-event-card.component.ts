import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { AppError } from '../../../core/http/app-error';
import { daysUntil } from '../data-access/next-event.mapper';
import type { NextEvent } from '../models/next-event.model';

@Component({
  selector: 'sh-next-event-card',
  imports: [RouterLink, NzButtonComponent, IconComponent],
  templateUrl: './next-event-card.component.html',
  styleUrl: './next-event-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextEventCardComponent {
  /** `undefined` tant que la liste n'est pas chargée, `null` s'il n'y a aucun événement à venir. */
  readonly event = input.required<NextEvent | null | undefined>();
  /** Jour de référence au format `YYYY-MM-DD`. */
  readonly today = input.required<string>();
  readonly error = input<AppError | null>(null);
  readonly loading = input<boolean>(false);
  readonly retry = output<void>();

  protected readonly daysRemaining = computed(() => {
    const event = this.event();
    return event ? daysUntil(event.targetDate, this.today()) : null;
  });

  protected readonly daysLabel = computed(() => {
    const days = this.daysRemaining();
    if (days === null) {
      return '';
    }
    if (days === 0) {
      return "Aujourd'hui";
    }
    return days === 1 ? '1 jour restant' : `${days} jours restants`;
  });
}
