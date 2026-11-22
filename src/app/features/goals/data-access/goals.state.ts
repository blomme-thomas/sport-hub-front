import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import type { Goal, GoalInput } from '../models/goal.model';
import { GoalsApi } from './goals.api';
import { partitionGoals, toCreateRequest, toUpdateRequest } from './goal.mapper';

/**
 * État des objectifs de la page : liste chargée une fois, répartie à venir / passés / sans date.
 * Chaque écriture réussie recharge la liste ; une écriture échouée rejette une `AppError` sans recharger.
 * Fourni au niveau de la page pour vivre le temps de l'écran.
 */
@Injectable()
export class GoalsState {
  private readonly api = inject(GoalsApi);
  private readonly goalsValue = signal<readonly Goal[]>([]);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly savingValue = signal(false);

  private readonly partition = computed(() => partitionGoals(this.goalsValue(), todayIsoUtc()));

  readonly upcoming = computed(() => this.partition().upcoming);
  readonly past = computed(() => this.partition().past);
  readonly undated = computed(() => this.partition().undated);
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  readonly isEmpty = computed(
    () => !this.loadingValue() && this.errorValue() === null && this.goalsValue().length === 0,
  );

  constructor() {
    this.reload();
  }

  reload(): void {
    void this.load();
  }

  /** @throws {AppError} quand l'API refuse la création ; la liste n'est pas rechargée */
  create(input: GoalInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.create(toCreateRequest(input))));
  }

  /** @throws {AppError} quand l'API refuse la modification ; la liste n'est pas rechargée */
  update(id: string, input: GoalInput): Promise<void> {
    return this.write(() => firstValueFrom(this.api.update(id, toUpdateRequest(input))));
  }

  /** @throws {AppError} quand l'API refuse la suppression ; la liste n'est pas rechargée */
  remove(id: string): Promise<void> {
    return this.write(() => firstValueFrom(this.api.delete(id)));
  }

  private async load(): Promise<void> {
    this.loadingValue.set(true);
    this.errorValue.set(null);
    try {
      this.goalsValue.set(await firstValueFrom(this.api.list()));
    } catch (error) {
      this.goalsValue.set([]);
      this.errorValue.set(asAppError(error));
    } finally {
      this.loadingValue.set(false);
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

function todayIsoUtc(): string {
  return new Date().toISOString().slice(0, 10);
}
