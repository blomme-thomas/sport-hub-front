import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { SpinnerComponent } from '@shared/ui/spinner/spinner.component';
import { disciplineStyleOf, type DisciplineStyle } from '@shared/ui/discipline/discipline-style';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../core/http/app-error';
import type { MiniCalendarView, WeekMiniDay } from '../data-access/week-mini-calendar.state';
import type { WeekMiniLegendEntry, WeekMiniSession } from '../models/week-mini-calendar.model';

/**
 * Mini-calendrier de la semaine : une icône par séance planifiée, dans la case de son jour, colorée selon sa discipline.
 * Lecture seule : un clic émet l'identifiant de la séance (ouverture de sa fiche). Présentationnel.
 */
@Component({
  selector: 'sh-week-mini-calendar',
  imports: [IconComponent, NzButtonComponent, SpinnerComponent],
  templateUrl: './week-mini-calendar.component.html',
  styleUrl: './week-mini-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekMiniCalendarComponent {
  readonly days = input.required<readonly WeekMiniDay[]>();
  /** Semaine (7 cases) ou mois (grille complète avec en-têtes des jours). */
  readonly view = input<MiniCalendarView>('week');
  readonly title = input('Cette semaine');
  readonly legend = input<readonly WeekMiniLegendEntry[]>([]);
  readonly loading = input(false);
  readonly busy = input(false);
  readonly empty = input(false);
  readonly error = input<AppError | null>(null);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly current = output<void>();
  readonly retry = output<void>();
  readonly sessionSelected = output<string>();

  /** Style (pictogramme et couleur) d'une discipline ; une clé inconnue reçoit le style neutre. */
  protected styleOf(typeKey: string): DisciplineStyle {
    return disciplineStyleOf(typeKey);
  }

  /** Libellé accessible d'une séance : discipline, heure, puis action. */
  protected labelOf(session: WeekMiniSession): string {
    const discipline = this.labelOfKey(session.disciplineTypeKey);
    const time = session.startTime ?? 'sans heure';
    return `Séance ${discipline}, ${time}. Ouvrir la séance`;
  }

  /** Libellé du référentiel pour une clé, ou la clé brute si la légende ne la connaît pas. */
  protected labelOfKey(typeKey: string): string {
    return this.legend().find((entry) => entry.typeKey === typeKey)?.label ?? typeKey;
  }

  protected readonly weekdayNames = ['Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.', 'Dim.'];

  /** Libellé d'une case : le jour et le mois en vue semaine, le numéro du jour en vue mois. */
  protected dayLabel(iso: string): string {
    if (this.view() === 'month') {
      return String(Number(iso.slice(8, 10)));
    }
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${iso}T00:00:00Z`));
  }
}
