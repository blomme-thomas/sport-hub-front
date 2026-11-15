import { Injectable, computed, inject, resource, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { localIsoDate } from '../../../shared/utils/iso-date';
import { disciplineStyleOf } from '../../../shared/ui/discipline/discipline-style';
import type { ActivitySummaryApi } from '../models/recent-activity.api-model';
import type { MonthActivity, MonthDay } from '../models/training-month.model';
import { RecentActivitiesApi } from './recent-activities.api';
import { firstDayOfMonth, buildMonthWeeks, shiftMonth } from './training-month.grid';
import { toRecentActivity } from './recent-activities.mapper';

/** Au-delà, le calendrier n'affiche pas les activités excédentaires d'un même mois. */
const PAGE_SIZE = 100;

/**
 * État du calendrier mensuel : activités réalisées du mois affiché, regroupées par jour.
 * La requête couvre le mois ; le jour suivant est exclu côté client. Fourni au niveau de la page.
 */
@Injectable()
export class TrainingMonthState {
  private readonly api = inject(RecentActivitiesApi);
  private readonly monthStartValue = signal(firstDayOfMonth(localIsoDate()));

  private readonly items = resource<ActivitySummaryApi[], string>({
    params: () => this.monthStartValue(),
    loader: ({ params: monthStart }) =>
      firstValueFrom(this.api.inRange(monthStart, nextMonthStart(monthStart), PAGE_SIZE)),
  });

  readonly monthStart = this.monthStartValue.asReadonly();
  readonly title = computed(() => capitalize(formatMonth(this.monthStartValue())));
  readonly isLoading = computed(() => this.items.isLoading());
  readonly isEmpty = computed(() => this.items.hasValue() && this.items.value().length === 0);
  readonly errorMessage = computed<string | null>(() => {
    const error = this.items.error();
    return error === undefined ? null : asAppError(error).userMessage;
  });

  readonly weeks = computed<MonthDay[][]>(() => {
    const monthStart = this.monthStartValue();
    const byDate = this.activitiesByDate(monthStart);
    return buildMonthWeeks(monthStart, byDate, localIsoDate());
  });

  previous(): void {
    this.monthStartValue.set(shiftMonth(this.monthStartValue(), -1));
  }

  next(): void {
    this.monthStartValue.set(shiftMonth(this.monthStartValue(), 1));
  }

  today(): void {
    this.monthStartValue.set(firstDayOfMonth(localIsoDate()));
  }

  reload(): void {
    this.items.reload();
  }

  private activitiesByDate(monthStart: string): Map<string, MonthActivity[]> {
    const byDate = new Map<string, MonthActivity[]>();
    if (!this.items.hasValue()) {
      return byDate;
    }
    const now = new Date();
    const month = monthStart.slice(0, 7);
    for (const item of this.items.value()) {
      const startedAt = new Date(item.startedAt);
      const date = localIsoDate(startedAt);
      if (!date.startsWith(month)) {
        continue;
      }
      const recent = toRecentActivity(item, now);
      const activity: MonthActivity = {
        id: item.id,
        typeLabel: recent.typeLabel,
        durationLabel: recent.durationLabel,
        discipline: disciplineStyleOf(item.type),
      };
      byDate.set(date, [...(byDate.get(date) ?? []), activity]);
    }
    return byDate;
  }
}

function nextMonthStart(monthStart: string): string {
  return shiftMonth(monthStart, 1);
}

function formatMonth(monthStart: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthStart}T00:00:00Z`));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
