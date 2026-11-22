import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputNumberComponent } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { firstValueFrom } from 'rxjs';
import { AI_FEATURES } from '../../../core/config/ai-features';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { PauseBannersComponent } from '../components/pause-banners/pause-banners.component';
import { PauseFormComponent, type PauseDraft } from '../components/pause-form/pause-form.component';
import {
  SessionFormComponent,
  type SessionDefaults,
} from '../components/session-form/session-form.component';
import { SessionImportComponent } from '../components/session-import/session-import.component';
import { type GridMove, WeekGridComponent } from '../components/week-grid/week-grid.component';
import { PausesState } from '../data-access/pauses.state';
import { PlanningApi, type EventGoal } from '../data-access/planning.api';
import { SessionsWriteApi, type CreateSessionRequestApi } from '../data-access/sessions-write.api';
import { SlotsState } from '../data-access/slots.state';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { Pause, PauseInput } from '../models/pause.model';
import type { SlotDefaults } from '../models/slot.model';
import { SessionModalService } from '@core/layout/session-modal.service';
import { fill, TEXTS } from '@shared/texts/texts';

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:00';
const WEEK_LAST_OFFSET_DAYS = 6;
/** Bornes de la durée proposée à la modification rapide, en minutes (le back accepte 1 à 1440). */
const QUICK_DURATION_MIN = 1;
const QUICK_DURATION_MAX = 1440;
const QUICK_DURATION_STEP = 5;

/**
 * Calendrier de la semaine : séances créées à la main. Un clic ou une sélection sur
 * la grille crée une séance ; un clic sur une séance propose sa fiche, sa suppression et, pour une séance
 * hebdomadaire, l'annulation ou la restauration de cette semaine. Les créneaux ne sont plus affichés ici.
 */
@Component({
  selector: 'sh-creneaux-page',
  imports: [
    FormsModule,
    IconComponent,
    NzButtonComponent,
    NzInputNumberComponent,
    ModalComponent,
    PauseBannersComponent,
    PauseFormComponent,
    SessionFormComponent,
    SessionImportComponent,
    WeekGridComponent,
  ],
  templateUrl: './creneaux.page.html',
  styleUrl: './creneaux.page.scss',
  providers: [SlotsState, PausesState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreneauxPage {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  protected readonly state = inject(SlotsState);
  protected readonly pausesState = inject(PausesState);

  constructor() {
    // Les pauses suivent la semaine affichée : chaque changement de semaine recharge leur liste.
    effect(() => {
      const from = this.state.weekStart();
      void this.pausesState.load(from, addIsoDays(from, WEEK_LAST_OFFSET_DAYS));
    });
  }

  /** Pause en cours de création (`pauseDraft`) ou de modification (`pauseEditing`), `null` quand la modale est fermée. */
  protected readonly pauseDraft = signal<PauseDraft | null>(null);
  protected readonly pauseEditing = signal<Pause | null>(null);
  protected readonly pauseError = signal<string | null>(null);
  protected readonly pauseSaving = signal(false);

  private readonly modal = inject(NzModalService);
  private readonly messages = inject(NzMessageService);
  private readonly sessionModal = inject(SessionModalService);
  private readonly sessionsWrite = inject(SessionsWriteApi);
  private readonly planningApi = inject(PlanningApi);

  /** Génération de planning : fonctionnalité IA, masquée et sans requête tant qu'elle est désactivée. */
  protected readonly aiEnabled = inject(AI_FEATURES);
  /** Modale de génération de planning ouverte. */
  protected readonly planningOpen = signal(false);
  /** Période choisie : la semaine affichée, le mois de cette semaine, ou jusqu'à un événement. */
  protected readonly planningPeriod = signal<PlanningPeriod>('semaine');
  protected readonly planningGoalId = signal<string | null>(null);
  protected readonly events = signal<readonly EventGoal[]>([]);
  protected readonly eventsError = signal<string | null>(null);
  /** Génération en cours : le calendrier est figé jusqu'à la réponse du back. */
  protected readonly planningBusy = signal(false);
  protected readonly planningError = signal<string | null>(null);

  /** Valeurs du formulaire de séance, `null` quand il est fermé. */
  protected readonly sessionDraft = signal<SessionDefaults | null>(null);
  protected readonly sessionError = signal<AppError | null>(null);
  protected readonly sessionSaving = signal(false);
  /** Déplacement d'une séance hebdomadaire en attente : cette occurrence seulement, ou toute la série. */
  protected readonly pendingMove = signal<(GridMove & { kind: 'session' }) | null>(null);
  /** Séance dont la durée est modifiée depuis sa vignette, `null` quand la modale est fermée. */
  protected readonly durationTarget = signal<SessionOccurrence | null>(null);
  /** Durée saisie dans la modale de modification rapide, en minutes. */
  protected readonly durationValue = signal(0);
  protected readonly durationStep = QUICK_DURATION_STEP;
  protected readonly durationMin = QUICK_DURATION_MIN;
  protected readonly durationMax = QUICK_DURATION_MAX;
  protected readonly disciplines = computed(() =>
    [...this.state.labels()].map(([typeKey, label]) => ({ typeKey, label })),
  );

  protected readonly weekLabel = computed(() =>
    formatWeek(this.state.weekStart(), this.state.weekEnd()),
  );

  /** Une plage choisie dans la grille ouvre directement le formulaire de séance. */
  protected chooseRange(range: SlotDefaults): void {
    this.openSessionCreate(range);
  }

  /** Ouvre le formulaire de création d'une séance, pré-rempli avec la plage choisie si elle est fournie. */
  protected openSessionCreate(range?: SlotDefaults): void {
    const defaults = range ?? defaultsFor(this.state.weekStart());
    this.sessionError.set(null);
    this.sessionDraft.set({
      date: defaults.date,
      startTime: defaults.startTime,
      endTime: defaults.endTime,
    });
  }

  protected closeSessionForm(): void {
    this.sessionDraft.set(null);
    this.sessionError.set(null);
  }

  /** Import multiple (story #133) : fenêtre ouverte depuis le calendrier. */
  protected readonly importOpen = signal(false);
  protected readonly importError = signal<AppError | null>(null);
  protected readonly importSaving = signal(false);

  protected openImport(): void {
    this.importError.set(null);
    this.importOpen.set(true);
  }

  protected closeImport(): void {
    this.importOpen.set(false);
    this.importError.set(null);
  }

  /** Envoie le fichier tel quel ; en cas de succès, le calendrier est rechargé pour afficher les séances créées. */
  protected async onImportSaved(content: unknown): Promise<void> {
    this.importError.set(null);
    this.importSaving.set(true);
    try {
      const result = await firstValueFrom(this.sessionsWrite.importPlan(content));
      this.importOpen.set(false);
      this.messages.success(fill(TEXTS.creneaux.session.imported, { count: result.createdCount }));
      this.state.reload();
    } catch (error) {
      this.importError.set(error instanceof AppError ? error : toAppError(error));
    } finally {
      this.importSaving.set(false);
    }
  }

  /** Crée la séance puis ouvre sa fiche (story #10). */
  protected async onSessionSaved(body: CreateSessionRequestApi): Promise<void> {
    this.sessionError.set(null);
    this.sessionSaving.set(true);
    try {
      const created = await firstValueFrom(this.sessionsWrite.create(body));
      this.sessionDraft.set(null);
      this.messages.success(TEXTS.creneaux.session.created);
      this.sessionModal.open(created.id);
    } catch (error) {
      this.sessionError.set(error instanceof AppError ? error : toAppError(error));
    } finally {
      this.sessionSaving.set(false);
    }
  }

  /**
   * Enregistre un déplacement fait à la souris. Une séance hebdomadaire demande d'abord le périmètre ; une séance
   * ponctuelle est déplacée directement. En cas d'erreur, le back a déjà notifié l'erreur ; la semaine est rechargée.
   */
  protected async onMoved(move: GridMove): Promise<void> {
    if (move.kind !== 'session') {
      return;
    }
    if (move.session.recurrence === 'hebdomadaire') {
      this.pendingMove.set(move);
      return;
    }
    await this.runOccurrenceAction(
      () =>
        firstValueFrom(
          this.sessionsWrite.move(move.session.id, { date: move.date, startTime: move.startTime }),
        ),
      TEXTS.creneaux.session.moved,
    );
  }

  /** Déplace cette occurrence seulement (les autres semaines ne bougent pas). */
  protected async moveThisOccurrence(): Promise<void> {
    const move = this.pendingMove();
    this.pendingMove.set(null);
    if (move === null) {
      return;
    }
    await this.runOccurrenceAction(
      () =>
        firstValueFrom(
          this.sessionsWrite.moveOccurrence(move.session.id, move.session.date, {
            date: move.date,
            startTime: move.startTime,
          }),
        ),
      TEXTS.creneaux.session.movedOccurrence,
    );
  }

  /** Déplace toute la série (sa date d'ancrage et son heure). */
  protected async moveWholeSeries(): Promise<void> {
    const move = this.pendingMove();
    this.pendingMove.set(null);
    if (move === null) {
      return;
    }
    await this.runOccurrenceAction(
      () =>
        firstValueFrom(
          this.sessionsWrite.move(move.session.id, { date: move.date, startTime: move.startTime }),
        ),
      TEXTS.creneaux.session.movedSeries,
    );
  }

  protected cancelPendingMove(): void {
    this.pendingMove.set(null);
    this.state.reload();
  }

  /** Annule cette occurrence seulement, ou la restaure si elle est déjà annulée. */
  protected async toggleOccurrence(session: SessionOccurrence): Promise<void> {
    if (session.status === 'annulee') {
      await this.runOccurrenceAction(
        () => firstValueFrom(this.sessionsWrite.restoreOccurrence(session.id, session.date)),
        TEXTS.creneaux.session.restored,
      );
      return;
    }
    await this.runOccurrenceAction(
      () => firstValueFrom(this.sessionsWrite.cancelOccurrence(session.id, session.date)),
      TEXTS.creneaux.session.cancelled,
    );
  }

  /** Demande confirmation puis supprime la séance ; une séance récurrente efface toute sa série. */
  protected confirmDeleteSession(session: SessionOccurrence): void {
    this.modal.confirm({
      nzClassName: 'sh-modal',
      nzTitle: TEXTS.creneaux.session.deleteTitle,
      nzContent:
        session.recurrence === 'hebdomadaire'
          ? TEXTS.creneaux.session.deleteSeries
          : TEXTS.creneaux.session.deleteOne,
      nzOkText: TEXTS.common.delete,
      nzOkDanger: true,
      nzCancelText: TEXTS.common.cancel,
      nzOnOk: () =>
        this.runOccurrenceAction(
          () => firstValueFrom(this.sessionsWrite.delete(session.id)),
          TEXTS.creneaux.session.deleted,
        ),
    });
  }

  /** Ouvre la modale de création d'une pause, avec la semaine affichée comme période par défaut. */
  protected openPauseCreate(): void {
    const from = this.state.weekStart();
    this.pauseEditing.set(null);
    this.pauseError.set(null);
    this.pauseDraft.set({
      startDate: from,
      endDate: addIsoDays(from, WEEK_LAST_OFFSET_DAYS),
      reason: 'vacances',
    });
  }

  protected openPauseEdit(pause: Pause): void {
    this.pauseEditing.set(pause);
    this.pauseError.set(null);
    this.pauseDraft.set({
      startDate: pause.startDate,
      endDate: pause.endDate,
      reason: pause.reason,
    });
  }

  protected closePauseForm(): void {
    this.pauseDraft.set(null);
    this.pauseEditing.set(null);
    this.pauseError.set(null);
  }

  /** Crée ou modifie la pause, puis ferme la modale. En cas d'erreur, la modale reste ouverte avec le message. */
  protected async savePause(body: PauseInput): Promise<void> {
    const editing = this.pauseEditing();
    this.pauseError.set(null);
    this.pauseSaving.set(true);
    try {
      if (editing === null) {
        await this.pausesState.create(body);
        this.messages.success(TEXTS.creneaux.pause.created);
      } else {
        await this.pausesState.update(editing.id, body);
        this.messages.success(TEXTS.creneaux.pause.edited);
      }
      this.closePauseForm();
    } catch (error) {
      this.pauseError.set(errorMessage(error));
    } finally {
      this.pauseSaving.set(false);
    }
  }

  /** Libellé du référentiel pour une clé de discipline, ou la clé brute si le référentiel ne la connaît pas. */
  protected disciplineLabel(typeKey: string): string {
    return this.state.labels().get(typeKey) ?? typeKey;
  }

  /** Demande confirmation avant de supprimer une pause. Les séances existantes sont conservées. */
  protected confirmDeletePause(pause: Pause): void {
    this.modal.confirm({
      nzClassName: 'sh-modal',
      nzTitle: TEXTS.creneaux.pause.deleteTitle,
      nzContent: TEXTS.creneaux.pause.deleteContent,
      nzOkText: TEXTS.common.delete,
      nzOkDanger: true,
      nzCancelText: TEXTS.common.cancel,
      nzOnOk: async () => {
        try {
          await this.pausesState.remove(pause.id);
          this.messages.success(TEXTS.creneaux.pause.deleted);
        } catch {
          // Message déjà affiché par l'intercepteur d'erreurs.
        }
      },
    });
  }

  /** Ouvre la modale de génération et charge les événements proposés pour la fin du planning. */
  protected async openPlanning(): Promise<void> {
    if (!this.aiEnabled) {
      return;
    }
    this.planningError.set(null);
    this.planningOpen.set(true);
    this.eventsError.set(null);
    try {
      this.events.set(await firstValueFrom(this.planningApi.listEvents()));
    } catch (error) {
      this.eventsError.set(errorMessage(error));
    }
  }

  protected closePlanning(): void {
    if (!this.planningBusy()) {
      this.planningOpen.set(false);
    }
  }

  /**
   * Lance la génération sur la période choisie. Une période entièrement passée est refusée sans appel au back.
   * Pendant l'appel, le calendrier est figé. En cas d'erreur, la modale affiche le message et la semaine n'est
   * pas rechargée : l'état du calendrier reste tel quel.
   */
  protected async generatePlanning(): Promise<void> {
    if (!this.aiEnabled) {
      return;
    }
    const body = this.planningRequest();
    if (body === null) {
      return;
    }
    const end = body.to ?? this.events().find((event) => event.id === body.goalId)?.targetDate;
    if (end !== undefined && end < localIsoDate()) {
      this.planningError.set(TEXTS.creneaux.planning.past);
      return;
    }
    this.planningError.set(null);
    this.planningBusy.set(true);
    try {
      const planning = await firstValueFrom(this.planningApi.generate(body));
      this.planningOpen.set(false);
      this.messages.success(
        planning.items.length === 0
          ? TEXTS.creneaux.planning.none
          : fill(TEXTS.creneaux.planning.created, { count: planning.items.length }),
      );
      this.state.reload();
    } catch (error) {
      this.planningError.set(errorMessage(error));
    } finally {
      this.planningBusy.set(false);
    }
  }

  /** Corps de la requête selon la période choisie, `null` si « jusqu'à un événement » n'a pas d'événement choisi. */
  private planningRequest(): { from: string; to?: string; goalId?: string } | null {
    const from = this.state.weekStart();
    switch (this.planningPeriod()) {
      case 'semaine':
        return { from, to: addIsoDays(from, WEEK_LAST_OFFSET_DAYS) };
      case 'mois':
        return { from, to: lastDayOfMonth(from) };
      case 'evenement': {
        const goalId = this.planningGoalId();
        const event = this.events().find((candidate) => candidate.id === goalId);
        return event === undefined ? null : { from, goalId: event.id };
      }
    }
  }

  /** Ouvre la modale de durée, pré-remplie avec la durée actuelle de la séance. */
  protected openDuration(session: SessionOccurrence): void {
    this.durationValue.set(session.durationMinutes);
    this.durationTarget.set(session);
  }

  protected closeDuration(): void {
    this.durationTarget.set(null);
  }

  /**
   * Enregistre la nouvelle durée (pour une série, celle de toute la série). En cas d'erreur, l'intercepteur notifie
   * le message et la semaine est rechargée : la durée d'origine revient à l'écran.
   */
  protected async saveDuration(): Promise<void> {
    const session = this.durationTarget();
    const minutes = this.durationValue();
    this.durationTarget.set(null);
    if (session === null || minutes === session.durationMinutes) {
      return;
    }
    await this.runOccurrenceAction(
      () => firstValueFrom(this.sessionsWrite.updateDuration(session.id, minutes)),
      TEXTS.creneaux.duration.saved,
    );
  }

  /** Un clic sur une séance ouvre sa fiche dans une modale (sortie nommée « modal », affichée par le shell). */
  protected openSession(session: SessionOccurrence): void {
    this.sessionModal.open(session.id);
  }

  /** Exécute une action, puis recharge la semaine. L'erreur est notifiée par l'intercepteur. */
  private async runOccurrenceAction(
    action: () => Promise<unknown>,
    success: string,
  ): Promise<void> {
    try {
      await action();
      this.messages.success(success);
    } catch {
      // Message déjà affiché par l'intercepteur d'erreurs.
    } finally {
      this.state.reload();
    }
  }
}

type PlanningPeriod = 'semaine' | 'mois' | 'evenement';

/** Dernier jour du mois de la date `YYYY-MM-DD` donnée. */
function lastDayOfMonth(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const monthIndex = Number(iso.slice(5, 7));
  return new Date(Date.UTC(year, monthIndex, 0)).toISOString().slice(0, 10);
}

/** Message affiché à l'utilisateur pour une erreur : celui de l'`AppError`, ou un message générique. */
function errorMessage(error: unknown): string {
  return error instanceof AppError ? error.userMessage : toAppError(error).userMessage;
}

/** Valeurs par défaut : aujourd'hui si la semaine affichée le contient, sinon son premier jour. */
function defaultsFor(weekStart: string): SlotDefaults {
  const today = localIsoDate();
  const inWeek = today >= weekStart && today <= addIsoDays(weekStart, WEEK_LAST_OFFSET_DAYS);
  return { date: inWeek ? today : weekStart, startTime: DEFAULT_START, endTime: DEFAULT_END };
}

function formatWeek(start: string, end: string): string {
  const format = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `Semaine du ${format.format(new Date(`${start}T00:00:00Z`))} au ${format.format(new Date(`${end}T00:00:00Z`))}`;
}
