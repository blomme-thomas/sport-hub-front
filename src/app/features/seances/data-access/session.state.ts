import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { MAX_DURATION_MINUTES, MAX_MODULES, MIN_DURATION_MINUTES } from '../models/session-options';
import type { EditableModule, ModuleType, Session } from '../models/session.model';
import { DisciplinesApi } from './disciplines.api';
import { SessionActivitiesApi } from './session-activities.api';
import type { SessionActivityApi } from '../models/session-activity.api-model';
import {
  NEW_MODULE_DEFAULTS,
  isDirty,
  toEditable,
  toReplaceRequest,
  toSession,
} from './session.mapper';
import { SessionsApi } from './sessions.api';

/**
 * État de la fiche d'une séance : séance enregistrée, brouillon des modules, chargement et enregistrement.
 * Le brouillon ne modifie la séance qu'à l'enregistrement, qui la remplace par la réponse du back.
 * Une séance réalisée est en lecture seule. Fourni au niveau de la page.
 */
@Injectable()
export class SessionState {
  private readonly sessionsApi = inject(SessionsApi);
  private readonly disciplinesApi = inject(DisciplinesApi);
  private readonly activitiesApi = inject(SessionActivitiesApi);

  private readonly sessionValue = signal<Session | null>(null);
  private readonly candidatesValue = signal<SessionActivityApi[]>([]);
  private readonly linkedDetailValue = signal<SessionActivityApi | null>(null);
  private readonly activityBusyValue = signal(false);
  private readonly activityErrorValue = signal<AppError | null>(null);
  private activityRequest = 0;
  private readonly draftValue = signal<EditableModule[]>([]);
  private readonly loadingValue = signal(false);
  private readonly errorValue = signal<AppError | null>(null);
  private readonly savingValue = signal(false);
  private readonly saveErrorValue = signal<AppError | null>(null);
  private labels = new Map<string, string>();
  private keySequence = 0;
  private latestRequest = 0;

  readonly session = this.sessionValue.asReadonly();
  readonly draft = this.draftValue.asReadonly();
  readonly isLoading = this.loadingValue.asReadonly();
  readonly error = this.errorValue.asReadonly();
  readonly saving = this.savingValue.asReadonly();
  readonly saveError = this.saveErrorValue.asReadonly();
  /** Activités du même jour et de la même discipline, hors activité déjà liée. */
  readonly activityCandidates = computed(() => {
    const linkedId = this.sessionValue()?.linkedActivity?.id;
    return this.candidatesValue().filter((activity) => activity.id !== linkedId);
  });
  /** Détail de l'activité liée (distance, durée, FC) ; `null` sans lien ou tant qu'il n'est pas chargé. */
  readonly linkedActivityDetail = this.linkedDetailValue.asReadonly();
  readonly activityBusy = this.activityBusyValue.asReadonly();
  readonly activityError = this.activityErrorValue.asReadonly();

  readonly readOnly = computed(() => this.sessionValue()?.status === 'realisee');
  readonly dirty = computed(() => {
    const session = this.sessionValue();
    return session !== null && isDirty(this.draftValue(), session.modules);
  });
  readonly canAddModule = computed(() => this.draftValue().length < MAX_MODULES);
  /** Clés des modules dont la durée ou la consigne n'est pas valide. */
  readonly invalidKeys = computed(
    () =>
      new Set(
        this.draftValue()
          .filter(
            (module) =>
              !isValidDuration(module.durationMinutes) || module.instruction.trim() === '',
          )
          .map((module) => module.key),
      ),
  );
  readonly canSave = computed(
    () => this.dirty() && this.invalidKeys().size === 0 && !this.readOnly() && !this.savingValue(),
  );
  readonly totalMinutes = computed(() =>
    this.draftValue().reduce((sum, module) => sum + (module.durationMinutes || 0), 0),
  );

  /** Charge la séance et le référentiel des disciplines ; une réponse périmée est ignorée. */
  async load(id: string): Promise<void> {
    const request = ++this.latestRequest;
    this.loadingValue.set(true);
    this.errorValue.set(null);
    this.saveErrorValue.set(null);
    try {
      const [api, labels] = await Promise.all([
        firstValueFrom(this.sessionsApi.get(id)),
        firstValueFrom(this.disciplinesApi.list()).catch(() => new Map<string, string>()),
      ]);
      if (request !== this.latestRequest) {
        return;
      }
      this.labels = labels;
      this.apply(toSession(api, (key) => labels.get(key) ?? key));
    } catch (error) {
      if (request === this.latestRequest) {
        this.sessionValue.set(null);
        this.errorValue.set(asAppError(error));
      }
    } finally {
      if (request === this.latestRequest) {
        this.loadingValue.set(false);
      }
    }
  }

  setDuration(key: number, minutes: number): void {
    this.updateModule(key, { durationMinutes: minutes });
  }

  setInstruction(key: number, instruction: string): void {
    this.updateModule(key, { instruction });
  }

  setType(key: number, type: ModuleType): void {
    this.updateModule(key, { type });
  }

  moveUp(key: number): void {
    this.move(key, -1);
  }

  moveDown(key: number): void {
    this.move(key, 1);
  }

  remove(key: number): void {
    this.draftValue.update((modules) => modules.filter((module) => module.key !== key));
  }

  add(): void {
    if (!this.canAddModule()) {
      return;
    }
    this.draftValue.update((modules) => [
      ...modules,
      { key: ++this.keySequence, ...NEW_MODULE_DEFAULTS, targetZones: null, perceivedEffort: null },
    ]);
  }

  /** Rétablit le brouillon sur la séance enregistrée. */
  revert(): void {
    const session = this.sessionValue();
    if (session !== null) {
      this.draftValue.set(toEditable(session.modules, () => ++this.keySequence));
    }
    this.saveErrorValue.set(null);
  }

  /** Enregistre l'ordre et le contenu des modules. Renvoie `false` si le back refuse (erreur dans `saveError`). */
  async save(): Promise<boolean> {
    const session = this.sessionValue();
    if (session === null || !this.canSave()) {
      return false;
    }
    this.savingValue.set(true);
    this.saveErrorValue.set(null);
    try {
      const api = await firstValueFrom(
        this.sessionsApi.replaceModules(session.id, toReplaceRequest(this.draftValue())),
      );
      this.apply(toSession(api, (key) => this.labels.get(key) ?? key));
      return true;
    } catch (error) {
      this.saveErrorValue.set(asAppError(error));
      return false;
    } finally {
      this.savingValue.set(false);
    }
  }

  /** Associe une activité du même jour ; la séance passe à réalisée côté back. Renvoie `false` en cas d'erreur. */
  async linkActivity(activityId: string): Promise<boolean> {
    const session = this.sessionValue();
    if (session === null) {
      return false;
    }
    return this.runActivityWrite(async () => {
      const api = await firstValueFrom(this.sessionsApi.linkActivity(session.id, activityId));
      this.apply(toSession(api, (key) => this.labels.get(key) ?? key));
    });
  }

  /** Dissocie l'activité liée. Le statut est conservé côté back, la séance est relue pour afficher le nouvel état. */
  async unlinkActivity(): Promise<boolean> {
    const session = this.sessionValue();
    if (session === null) {
      return false;
    }
    return this.runActivityWrite(async () => {
      await firstValueFrom(this.sessionsApi.unlinkActivity(session.id));
      const api = await firstValueFrom(this.sessionsApi.get(session.id));
      this.apply(toSession(api, (key) => this.labels.get(key) ?? key));
    });
  }

  private async runActivityWrite(write: () => Promise<void>): Promise<boolean> {
    this.activityBusyValue.set(true);
    this.activityErrorValue.set(null);
    try {
      await write();
      return true;
    } catch (error) {
      this.activityErrorValue.set(asAppError(error));
      return false;
    } finally {
      this.activityBusyValue.set(false);
    }
  }

  private apply(session: Session): void {
    this.sessionValue.set(session);
    this.draftValue.set(toEditable(session.modules, () => ++this.keySequence));
    void this.loadActivities(session);
  }

  /** Charge les activités du jour (candidates) et le détail de l'activité liée. Une réponse périmée est ignorée. */
  private async loadActivities(session: Session): Promise<void> {
    const request = ++this.activityRequest;
    try {
      const [candidates, linked] = await Promise.all([
        firstValueFrom(this.activitiesApi.listForDay(session.date)),
        session.linkedActivity
          ? firstValueFrom(this.activitiesApi.detail(session.linkedActivity.id))
          : Promise.resolve(null),
      ]);
      if (request !== this.activityRequest) {
        return;
      }
      this.candidatesValue.set(
        candidates.filter((activity) => activity.type === session.disciplineTypeKey),
      );
      this.linkedDetailValue.set(linked);
    } catch (error) {
      if (request === this.activityRequest) {
        this.candidatesValue.set([]);
        this.linkedDetailValue.set(null);
        this.activityErrorValue.set(asAppError(error));
      }
    }
  }

  private updateModule(key: number, changes: Partial<EditableModule>): void {
    this.draftValue.update((modules) =>
      modules.map((module) => (module.key === key ? { ...module, ...changes } : module)),
    );
  }

  private move(key: number, delta: -1 | 1): void {
    this.draftValue.update((modules) => {
      const index = modules.findIndex((module) => module.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= modules.length) {
        return modules;
      }
      const next = [...modules];
      const moved = next[index];
      const other = next[target];
      if (moved === undefined || other === undefined) {
        return modules;
      }
      next[index] = other;
      next[target] = moved;
      return next;
    });
  }
}

export function isValidDuration(minutes: number): boolean {
  return (
    Number.isInteger(minutes) && minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES
  );
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
