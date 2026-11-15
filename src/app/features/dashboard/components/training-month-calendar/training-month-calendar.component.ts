import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { MonthDay } from '../../models/training-month.model';

const WEEKDAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

/**
 * Carte « Calendrier d'entraînement » : une pastille par sport réalisé sur chaque jour, navigation par mois.
 * Présentation pure : les semaines et l'état arrivent en entrée. Un clic sélectionne un jour (détail hors périmètre).
 */
@Component({
  selector: 'sh-training-month-calendar',
  imports: [IconComponent, NzButtonComponent],
  templateUrl: './training-month-calendar.component.html',
  styleUrl: './training-month-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainingMonthCalendarComponent {
  readonly title = input.required<string>();
  readonly weeks = input<MonthDay[][]>([]);
  readonly loading = input(false);
  readonly empty = input(false);
  readonly error = input<string | null>(null);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly current = output<void>();
  readonly retry = output<void>();

  protected readonly weekdayNames = WEEKDAY_NAMES;
  protected readonly selectedDate = signal<string | null>(null);

  protected select(day: MonthDay): void {
    this.selectedDate.set(day.date);
  }
}
