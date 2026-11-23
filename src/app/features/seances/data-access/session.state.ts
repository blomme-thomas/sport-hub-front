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
import { SessionExportApi } from './session-export.api';
import { saveBlob } from '../../../shared/utils/download';
import type { PlanSeanceModule } from '../../../shared/plan-seances/plan-seances.model';
import type { UpdateSessionRequestApi } from '../models/session.api-model';

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
  private readonly exportApi = inject(SessionExportApi);
  private readonly exportingValue = signal(false);
  private readonly disciplineOptionsValue = signal<readonly { typeKey: string; label: string }[]>(
    [],
  );

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
  readonly exporting = this.exportingValue.asReadonly();
  /** Disciplines du référentiel, pour le formulaire de modification. */
  readonly disciplines = this.disciplineOptionsValue.asReadonly();

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
      this.disciplineOptionsValue.set([...labels].map(([typeKey, label]) => ({ typeKey, label })));
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

  /** Place le module `key` à la position `toIndex` (0 = premier) ; les autres glissent pour lui faire place. */
  moveTo(key: number, toIndex: number): void {
    this.draftValue.update((modules) => {
      const fromIndex = modules.findIndex((module) => module.key === key);
      if (fromIndex < 0 || toIndex < 0 || toIndex >= modules.length || fromIndex === toIndex) {
        return modules;
      }
      const next = [...modules];
      const [moved] = next.splice(fromIndex, 1);
      if (moved === undefined) {
        return modules;
      }
      next.splice(toIndex, 0, moved);
      return next;
    });
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

  /**
   * Enregistre les champs de la séance (`PATCH`) puis, si un fichier JSON a fourni des modules, la liste des modules
   * (`PUT`). Renvoie `false` si le back refuse (erreur dans `saveError`) ; une réponse réussie remplace la séance.
   */
  async saveDetails(
    details: UpdateSessionRequestApi,
    modules: readonly PlanSeanceModule[] | null,
  ): Promise<boolean> {
    const session = this.sessionValue();
    if (session === null || this.readOnly() || this.savingValue()) {
      return false;
    }
    this.savingValue.set(true);
    this.saveErrorValue.set(null);
    try {
      const updated = await firstValueFrom(this.sessionsApi.update(session.id, details));
      this.apply(toSession(updated, (key) => this.labels.get(key) ?? key));
      if (modules !== null) {
        this.draftValue.set(
          modules.map((module) => ({
            key: ++this.keySequence,
            type: module.type,
            durationMinutes: module.durationMinutes,
            instruction: module.instruction,
            targetZones: module.targetZones,
            perceivedEffort: module.perceivedEffort,
          })),
        );
        const withModules = await firstValueFrom(
          this.sessionsApi.replaceModules(session.id, toReplaceRequest(this.draftValue())),
        );
        this.apply(toSession(withModules, (key) => this.labels.get(key) ?? key));
      }
      return true;
    } catch (error) {
      this.saveErrorValue.set(asAppError(error));
      return false;
    } finally {
      this.savingValue.set(false);
    }
  }

  /** Supprime la séance (et sa série si elle est récurrente). `false` et erreur conservée en cas d'échec. */
  async delete(): Promise<boolean> {
    const session = this.sessionValue();
    if (session === null || this.savingValue()) {
      return false;
    }
    this.savingValue.set(true);
    this.saveErrorValue.set(null);
    try {
      await firstValueFrom(this.sessionsApi.delete(session.id));
      return true;
    } catch (error) {
      this.saveErrorValue.set(asAppError(error));
      return false;
    } finally {
      this.savingValue.set(false);
    }
  }

  /**
   * Télécharge le JSON de la séance avec son activité réalisée. Sans activité liée, ne fait rien.
   * Une erreur (réseau, 404) est notifiée par l'intercepteur HTTP ; l'écran reste affiché.
   */
  async exportLinkedSession(): Promise<void> {
    const session = this.sessionValue();
    if (session?.linkedActivity == null || this.exportingValue()) {
      return;
    }
    this.exportingValue.set(true);
    try {
      const file = await firstValueFrom(this.exportApi.download(session.id));
      saveBlob(file, `seance-${session.date}-${session.id}.json`);
    } catch {
      // Notifiée par l'intercepteur HTTP.
    } finally {
      this.exportingValue.set(false);
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
}

export function isValidDuration(minutes: number): boolean {
  return (
    Number.isInteger(minutes) && minutes >= MIN_DURATION_MINUTES && minutes <= MAX_DURATION_MINUTES
  );
}

function asAppError(error: unknown): AppError {
  return error instanceof AppError ? error : toAppError(error);
}
