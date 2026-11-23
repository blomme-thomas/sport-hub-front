import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { disciplineStyleOf, type DisciplineStyle } from '@shared/ui/discipline/discipline-style';
import { addIsoDays, localIsoDate } from '@shared/utils/iso-date';
import { isoWeekOf, mondayOfIsoWeek } from '@shared/utils/iso-week';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import type { WeekMiniDay } from '../../data-access/week-mini-calendar.state';
import type { WeekMiniLegendEntry, WeekMiniSession } from '../../models/week-mini-calendar.model';
import { fill, TEXTS } from '@shared/texts/texts';

const DAYS_PER_WEEK = 7;

/**
 * Mini-calendrier du mois : grille lundi à dimanche avec les en-têtes des jours. Une icône par séance planifiée,
 * colorée selon sa discipline, et un repère par activité réalisée. Le jour d'aujourd'hui et la semaine en cours
 * sont surlignés. Lecture seule : un clic émet l'identifiant de la séance (ouverture de sa fiche). Présentationnel.
 */
@Component({
  selector: 'sh-week-mini-calendar',
  imports: [IconComponent, NzButtonComponent, NgTemplateOutlet],
  templateUrl: './week-mini-calendar.component.html',
  styleUrl: './week-mini-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekMiniCalendarComponent {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly days = input.required<readonly WeekMiniDay[]>();
  /** Nom du mois affiché (« Novembre 2026 »), porté par le bouton qui revient au mois courant. */
  readonly title = input(TEXTS.dashboard.miniCalendar.title);
  readonly legend = input<readonly WeekMiniLegendEntry[]>([]);
  readonly loading = input(false);
  readonly error = input<AppError | null>(null);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly current = output<void>();
  readonly retry = output<void>();
  readonly sessionSelected = output<string>();
  /** Date `YYYY-MM-DD` du jour cliqué dans la vue mois. */
  readonly daySelected = output<string>();

  /** Jour local d'aujourd'hui, marqué dans la grille. */
  protected readonly todayIso = localIsoDate();

  /** Lundi et dimanche de la semaine en cours : ses sept jours sont surlignés dans la grille. */
  private readonly currentWeekStart = mondayOfIsoWeek(isoWeekOf(this.todayIso));
  private readonly currentWeekEnd = addIsoDays(this.currentWeekStart, DAYS_PER_WEEK - 1);

  /** Samedi ou dimanche : fond distinct. */
  protected isWeekend(iso: string): boolean {
    const day = new Date(`${iso}T00:00:00Z`).getUTCDay();
    return day === 0 || day === 6;
  }

  /** Vrai pour les sept jours de la semaine en cours. */
  protected isInCurrentWeek(iso: string): boolean {
    return iso >= this.currentWeekStart && iso <= this.currentWeekEnd;
  }

  /** Style (pictogramme et couleur) d'une discipline ; une clé inconnue reçoit le style neutre. */
  protected styleOf(typeKey: string): DisciplineStyle {
    return disciplineStyleOf(typeKey);
  }

  /** Libellé accessible d'une séance : discipline, heure, puis action. */
  protected labelOf(session: WeekMiniSession): string {
    const discipline = session.disciplineLabel ?? this.labelOfKey(session.disciplineTypeKey);
    return fill(TEXTS.dashboard.miniCalendar.session, { discipline, time: session.startTime });
  }

  /** Libellé du référentiel pour une clé, ou la clé brute si la légende ne la connaît pas. */
  protected labelOfKey(typeKey: string): string {
    return this.legend().find((entry) => entry.typeKey === typeKey)?.label ?? typeKey;
  }

  protected readonly weekdayNames = TEXTS.dashboard.miniCalendar.weekdays;

  /** Numéro du jour dans la case. */
  protected dayNumber(iso: string): string {
    return String(Number(iso.slice(8, 10)));
  }
}
