import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { disciplineStyleOf, type DisciplineStyle } from '../models/discipline-style';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { Slot, SlotInput } from '../models/slot.model';
import type { WeekDay } from '../models/week-day.model';
import { DisciplinesApi } from './disciplines.api';
import { SessionOccurrencesApi } from './session-occurrences.api';
import { SlotsApi } from './slots.api';
import { mondayOf, toCreateRequest, toUpdateRequest, weekDates } from './slot.mapper';

const WEEK_LAST_OFFSET_DAYS = 6;

/** Discipline présente sur la semaine, pour la légende du calendrier. */
export interface LegendEntry {
  typeKey: string;
  label: string;
  style: DisciplineStyle;
}

/**
 * État du calendrier : semaine affichée, créneaux et séances de cette semaine, chargement et erreurs.
 * Changer de semaine recharge la liste ; une réponse périmée (semaine déjà quittée) est ignorée.
 * Chaque écriture de créneau réussie recharge la semaine ; une écriture échouée rejette une `AppError` sans recharger.
 * Fourni au niveau de la page pour vivre le temps de l'écran.
 */
@Injectable()
export class SlotsState {
  private readonly api = inject(SlotsApi);
  private readonly sessionsApi = inject(SessionOccurrencesApi);
  private readonly disciplinesApi = inject(DisciplinesApi);
  private readonly weekStartValue = signal(mondayOf(localIsoDate()));
  private readonly slotsValue = signal<readonly Slot[]>([]);
  private readonly sessionsValue = signal<readonly SessionOccurrence[]>([]);
  private readonly labelsValue = signal<ReadonlyMap<string, string>>(new Map());
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly savingValue = signal(false);
  private latestRequest = 0;

  readonly weekStart = this.weekStartValue.asReadonly();
  readonly weekEnd = computed(() => addIsoDays(this.weekStartValue(), WEEK_LAST_OFFSET_DAYS));
  readonly days = computed<WeekDay[]>(() => {
    const sessionsByDate = groupByDate(this.sessionsValue());
    return weekDates(this.weekStartValue()).map((date) => ({
      date,
      slots: [],
      sessions: sessionsByDate.get(date) ?? [],
    }));
  });
  readonly legend = computed<LegendEntry[]>(() => {
    const labels = this.labelsValue();
    const keys = new Set([...this.sessionsValue().map((session) => session.disciplineTypeKey)]);
    return [...keys].map((typeKey) => ({
      typeKey,
      label: labels.get(typeKey) ?? typeKey,
      style: disciplineStyleOf(typeKey),
    }));
  });
  readonly labels = this.labelsValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  readonly isEmpty = computed(
    () =>
      !this.loadingValue() &&
      this.errorValue() === null &&
      this.slotsValue().length === 0 &&
      this.sessionsValue().length === 0,
  );

  constructor() {
    this.loadLabels();
    this.reload();
  }

  reload(): void {
    void this.load();
  }

  previousWeek(): void {
    this.moveTo(addIsoDays(this.weekStartValue(), -7));
  }

  nextWeek(): void {
    this.moveTo(addIsoDays(this.weekStartValue(), 7));
  }

  currentWeek(): void {
    this.moveTo(mondayOf(localIsoDate()));
  }

  /** @throws {AppError} quand l'API refuse la création ; la semaine n'est pas rechargée */
  create(input: SlotInput): Promise<void> {
    return this.write(() =>
      firstValueFrom(this.api.create(toCreateRequest(input, browserTimeZone()))),
    );
  }

  /** @throws {AppError} quand l'API refuse la modification ; la semaine n'est pas rechargée */
  update(id: string, input: SlotInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.update(id, toUpdateRequest(input))));
  }

  /** @throws {AppError} quand l'API refuse la suppression ; la semaine n'est pas rechargée */
  remove(id: string): Promise<void> {
    return this.write(() => firstValueFrom(this.api.delete(id)));
  }

  private moveTo(monday: string): void {
    this.weekStartValue.set(monday);
    this.slotsValue.set([]);
    this.sessionsValue.set([]);
    this.reload();
  }

  private loadLabels(): void {
    firstValueFrom(this.disciplinesApi.list())
      .then((labels) => this.labelsValue.set(labels))
      .catch(() => this.labelsValue.set(new Map()));
  }

  private async load(): Promise<void> {
    const request = ++this.latestRequest;
    const from = this.weekStartValue();
    const to = addIsoDays(from, WEEK_LAST_OFFSET_DAYS);
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const sessions = await firstValueFrom(this.sessionsApi.list(from, to));
      if (request === this.latestRequest) {
        this.sessionsValue.set(sessions);
      }
    } catch (error) {
      if (request === this.latestRequest) {
        this.sessionsValue.set([]);
        this.errorValue.set(asAppError(error));
      }
    } finally {
      if (request === this.latestRequest) {
        this.loadingValue.set(false);
      }
    }
  }

  private async write(operation: () => Promise<unknown>): Promise<void> {
    this.savingValue.set(true);
    try {
      await operation();
    } catch (error) {
      throw asAppError(error);
    } finally {
      this.savingValue.set(false);
    }
    await this.load();
  }
}

function groupByDate<T extends { date: string }>(items: readonly T[]): Map<string, T[]> {
  const byDate = new Map<string, T[]>();
  for (const item of items) {
    byDate.set(item.date, [...(byDate.get(item.date) ?? []), item]);
  }
  return byDate;
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
