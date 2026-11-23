import { Injectable, Signal, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { fill, TEXTS } from '@shared/texts/texts';
import type { WeekMiniDiscipline } from '../models/week-mini-calendar.model';
import { WeekSessionsApi } from './week-sessions.api';
import { UpcomingSessionsApi, type UpcomingSession } from './upcoming-sessions.api';
import { formatDuration } from './recent-activities.mapper';

/** Nombre de séances affichées ; la carte défile au-delà de quatre lignes visibles. */
const PAGE_SIZE = 20;
/** Fenêtre interrogée à partir d'aujourd'hui : 366 jours, borne de `GET /api/sessions`. */
const WINDOW_LAST_OFFSET_DAYS = 365;

/** Ligne de la carte, déjà formatée pour l'affichage. */
export interface UpcomingSessionView {
  id: string;
  dateLabel: string;
  timeLabel: string;
  typeLabel: string;
  title: string | null;
  durationLabel: string;
  /** Libellé accessible : « Séance Course à pied le lun. 30 nov. à 18:00 ». */
  ariaLabel: string;
}

interface UpcomingLoad {
  sessions: UpcomingSession[];
  labels: ReadonlyMap<string, WeekMiniDiscipline>;
}

/**
 * État de la carte « Séances programmées » : les 20 prochaines séances planifiées, à partir d'aujourd'hui,
 * triées par date puis par heure. Lecture seule. Fourni au niveau de la page, séparément des autres blocs.
 */
@Injectable()
export class UpcomingSessionsState {
  private readonly api = inject(UpcomingSessionsApi);
  private readonly disciplinesApi = inject(WeekSessionsApi);

  private readonly items = resource<UpcomingLoad, void>({
    loader: async () => {
      const from = localIsoDate();
      const to = addIsoDays(from, WINDOW_LAST_OFFSET_DAYS);
      const [sessions, labels] = await Promise.all([
        firstValueFrom(this.api.list(from, to)),
        firstValueFrom(this.disciplinesApi.disciplines()),
      ]);
      return { sessions: [...sessions].sort(byDateThenTime).slice(0, PAGE_SIZE), labels };
    },
  });

  /** `undefined` tant que la liste n'est pas chargée, tableau vide s'il n'y a aucune séance à venir. */
  readonly sessions: Signal<UpcomingSessionView[] | undefined> = computed(() => {
    if (!this.items.hasValue()) {
      return undefined;
    }
    const { sessions, labels } = this.items.value();
    return sessions.map((session) => toView(session, labels));
  });

  readonly isLoading = computed(() => this.items.isLoading());

  readonly error = computed<AppError | null>(() => {
    const error = this.items.error();
    if (error === undefined) {
      return null;
    }
    return error instanceof AppError ? error : toAppError(error);
  });

  reload(): void {
    this.items.reload();
  }
}

function byDateThenTime(a: UpcomingSession, b: UpcomingSession): number {
  return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
}

function toView(
  session: UpcomingSession,
  labels: ReadonlyMap<string, WeekMiniDiscipline>,
): UpcomingSessionView {
  const typeLabel = labels.get(session.disciplineTypeKey)?.label ?? session.disciplineTypeKey;
  const dateLabel = formatShortDate(session.date);
  return {
    id: session.id,
    dateLabel,
    timeLabel: session.startTime,
    typeLabel,
    title: session.title,
    durationLabel: formatDuration(session.durationMinutes * 60),
    ariaLabel: fill(TEXTS.dashboard.upcoming.detailLabel, {
      type: typeLabel,
      date: dateLabel,
      time: session.startTime,
    }),
  };
}

/** Date courte, en français : « lun. 30 nov. ». Calcul en UTC sur la date seule, sans effet de fuseau. */
function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}
