import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import type { Slot, SlotInput } from '../models/slot.model';
import type { WeekDay } from '../models/week-day.model';
import { SlotsApi } from './slots.api';
import { mondayOf, toCreateRequest, toUpdateRequest, weekDates } from './slot.mapper';

const WEEK_LAST_OFFSET_DAYS = 6;

/**
 * État de la page des créneaux : semaine affichée, créneaux de cette semaine, chargement et erreurs.
 * Changer de semaine recharge la liste ; une réponse périmée (semaine déjà quittée) est ignorée.
 * Chaque écriture réussie recharge la semaine ; une écriture échouée rejette une `AppError` sans recharger.
 * Fourni au niveau de la page pour vivre le temps de l'écran.
 */
@Injectable()
export class SlotsState {
  private readonly api = inject(SlotsApi);
  private readonly weekStartValue = signal(mondayOf(localIsoDate()));
  private readonly slotsValue = signal<readonly Slot[]>([]);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly savingValue = signal(false);
  private latestRequest = 0;

  readonly weekStart = this.weekStartValue.asReadonly();
  readonly weekEnd = computed(() => addIsoDays(this.weekStartValue(), WEEK_LAST_OFFSET_DAYS));
  readonly days = computed<WeekDay[]>(() => {
    const byDate = new Map<string, Slot[]>();
    for (const slot of this.slotsValue()) {
      byDate.set(slot.date, [...(byDate.get(slot.date) ?? []), slot]);
    }
    return weekDates(this.weekStartValue()).map((date) => ({
      date,
      slots: byDate.get(date) ?? [],
    }));
  });
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  readonly isEmpty = computed(
    () => !this.loadingValue() && this.errorValue() === null && this.slotsValue().length === 0,
  );

  constructor() {
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
    this.reload();
  }

  private async load(): Promise<void> {
    const request = ++this.latestRequest;
    const from = this.weekStartValue();
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      const slots = await firstValueFrom(
        this.api.list(from, addIsoDays(from, WEEK_LAST_OFFSET_DAYS)),
      );
      if (request === this.latestRequest) {
        this.slotsValue.set(slots);
      }
    } catch (error) {
      if (request === this.latestRequest) {
        this.slotsValue.set([]);
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

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
