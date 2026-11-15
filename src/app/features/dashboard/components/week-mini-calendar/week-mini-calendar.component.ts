import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { disciplineStyleOf, type DisciplineStyle } from '@shared/ui/discipline/discipline-style';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import type { MiniCalendarView, WeekMiniDay } from '../../data-access/week-mini-calendar.state';
import type {
  WeekMiniActivity,
  WeekMiniLegendEntry,
  WeekMiniSession,
} from '../../models/week-mini-calendar.model';

/** Plage horaire affichée en vue semaine, par créneaux de deux heures ; elle s'élargit si une séance tombe en dehors. */
const FIRST_HOUR = 6;
const LAST_HOUR = 22;
const SLOT_HOURS = 2;

/** Une case de la vue semaine : un jour, à une heure donnée (ou sans heure). */
export interface WeekTimeCell {
  date: string;
  inPeriod: boolean;
  sessions: WeekMiniSession[];
  realized: WeekMiniActivity[];
}

/** Une ligne de la vue semaine : une heure (ou « Sans heure ») et une case par jour. */
export interface WeekTimeRow {
  key: string;
  label: string;
  cells: WeekTimeCell[];
}

/**
 * Mini-calendrier : vue semaine en tableau, heures à gauche et jours en colonnes ; vue mois en grille.
 * Une icône par séance planifiée, colorée selon sa discipline, et un repère par activité réalisée.
 * Lecture seule : un clic émet l'identifiant de la séance (ouverture de sa fiche). Présentationnel.
 */
@Component({
  selector: 'sh-week-mini-calendar',
  imports: [IconComponent, NzButtonComponent, NgTemplateOutlet],
  templateUrl: './week-mini-calendar.component.html',
  styleUrl: './week-mini-calendar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekMiniCalendarComponent {
  readonly days = input.required<readonly WeekMiniDay[]>();
  /** Semaine (7 colonnes, une ligne par heure) ou mois (grille complète avec en-têtes des jours). */
  readonly view = input<MiniCalendarView>('week');
  readonly title = input('Cette semaine');
  readonly legend = input<readonly WeekMiniLegendEntry[]>([]);
  readonly loading = input(false);
  readonly empty = input(false);
  readonly error = input<AppError | null>(null);

  readonly previous = output<void>();
  readonly next = output<void>();
  readonly current = output<void>();
  readonly retry = output<void>();
  readonly sessionSelected = output<string>();

  /** Lignes de la vue semaine : une par heure de la plage, avec une ligne « Sans heure » si besoin. */
  protected readonly timeRows = computed<WeekTimeRow[]>(() => {
    const days = this.days();
    const hours = new Set<number>();
    let hasUntimed = false;
    for (const day of days) {
      for (const item of [...day.sessions, ...day.realized]) {
        const slot = slotOf(item.startTime);
        if (slot === null) {
          hasUntimed = true;
        } else {
          hours.add(slot);
        }
      }
    }
    const first = Math.min(FIRST_HOUR, ...hours);
    const last = Math.max(LAST_HOUR, ...hours);
    const slots: (number | null)[] = hasUntimed ? [null] : [];
    for (let hour = first; hour <= last; hour += SLOT_HOURS) {
      slots.push(hour);
    }
    return slots.map((hour) => ({
      key: hour === null ? 'sans-heure' : `h${hour}`,
      label: hour === null ? 'Sans heure' : `${hour} h`,
      cells: days.map((day) => ({
        date: day.date,
        inPeriod: day.inPeriod,
        sessions: day.sessions.filter((session) => slotOf(session.startTime) === hour),
        realized: day.realized.filter((activity) => slotOf(activity.startTime) === hour),
      })),
    }));
  });

  /** Style (pictogramme et couleur) d'une discipline ; une clé inconnue reçoit le style neutre. */
  protected styleOf(typeKey: string): DisciplineStyle {
    return disciplineStyleOf(typeKey);
  }

  /** Libellé accessible d'une séance : discipline, heure, puis action. */
  protected labelOf(session: WeekMiniSession): string {
    const discipline = session.disciplineLabel ?? this.labelOfKey(session.disciplineTypeKey);
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

/** Créneau de deux heures d'un horaire `HH:mm` (le créneau pair qui le contient), ou `null` sans horaire. */
function slotOf(time: string | null): number | null {
  if (time === null) {
    return null;
  }
  const hour = Number(time.slice(0, 2));
  return hour - (hour % SLOT_HOURS);
}
