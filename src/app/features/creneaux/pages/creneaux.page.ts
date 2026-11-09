import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalComponent, NzModalContentDirective, NzModalService } from 'ng-zorro-antd/modal';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { SessionFormComponent, type SessionDefaults } from '../components/session-form.component';
import { SlotFormComponent } from '../components/slot-form.component';
import { type GridMove, WeekGridComponent } from '../components/week-grid.component';
import { SessionsWriteApi, type CreateSessionRequestApi } from '../data-access/sessions-write.api';
import { SlotsState } from '../data-access/slots.state';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { Slot, SlotDefaults, SlotInput } from '../models/slot.model';

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:00';
const WEEK_LAST_OFFSET_DAYS = 6;

/** Calendrier de la semaine : créneaux et séances, création par clic ou formulaire, modification d'un créneau. */
@Component({
  selector: 'sh-creneaux-page',
  imports: [
    IconComponent,
    NzButtonComponent,
    NzModalComponent,
    NzModalContentDirective,
    SessionFormComponent,
    SlotFormComponent,
    WeekGridComponent,
  ],
  templateUrl: './creneaux.page.html',
  styleUrl: './creneaux.page.scss',
  providers: [SlotsState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreneauxPage {
  protected readonly state = inject(SlotsState);

  private readonly modal = inject(NzModalService);
  private readonly messages = inject(NzMessageService);
  private readonly router = inject(Router);
  private readonly sessionsWrite = inject(SessionsWriteApi);

  /** Créneau en cours de modification, `'new'` pour une création, `null` quand le formulaire est fermé. */
  protected readonly editing = signal<Slot | 'new' | null>(null);
  protected readonly formSlot = computed(() => {
    const target = this.editing();
    return target === null || target === 'new' ? null : target;
  });
  protected readonly formTitle = computed(() =>
    this.editing() === 'new' ? 'Nouveau créneau' : 'Modifier le créneau',
  );
  protected readonly formDefaults = signal<SlotDefaults>(defaultsFor(this.state.weekStart()));
  protected readonly formError = signal<AppError | null>(null);

  /** Plage choisie dans la grille, le temps de demander s'il faut créer un créneau ou une séance. */
  protected readonly chosenRange = signal<SlotDefaults | null>(null);
  /** Valeurs du formulaire de séance, `null` quand il est fermé. */
  protected readonly sessionDraft = signal<SessionDefaults | null>(null);
  protected readonly sessionError = signal<AppError | null>(null);
  protected readonly sessionSaving = signal(false);
  /** Déplacement d'une séance hebdomadaire en attente : cette occurrence seulement, ou toute la série. */
  protected readonly pendingMove = signal<(GridMove & { kind: 'session' }) | null>(null);
  /** Séance hebdomadaire dont une occurrence a été cliquée : fiche, annulation ou restauration. */
  protected readonly occurrenceChoice = signal<SessionOccurrence | null>(null);
  protected readonly disciplines = computed(() =>
    [...this.state.labels()].map(([typeKey, label]) => ({ typeKey, label })),
  );

  protected readonly weekLabel = computed(() =>
    formatWeek(this.state.weekStart(), this.state.weekEnd()),
  );

  /** Une plage est choisie dans la grille : on demande ce qu'il faut créer. */
  protected chooseRange(range: SlotDefaults): void {
    this.chosenRange.set(range);
  }

  protected cancelChoice(): void {
    this.chosenRange.set(null);
  }

  protected createSlotFromChoice(): void {
    const range = this.chosenRange();
    this.chosenRange.set(null);
    this.openCreate(range ?? undefined);
  }

  protected createSessionFromChoice(): void {
    const range = this.chosenRange();
    this.chosenRange.set(null);
    this.openSessionCreate(range ?? undefined);
  }

  /** Ouvre une création de créneau, pré-remplie avec la plage choisie si elle est fournie. */
  protected openCreate(range?: SlotDefaults): void {
    this.formError.set(null);
    this.formDefaults.set(range ?? defaultsFor(this.state.weekStart()));
    this.editing.set('new');
  }

  /** Ouvre le formulaire de création d'une séance, pré-rempli avec la plage choisie si elle est fournie. */
  protected openSessionCreate(range?: SlotDefaults): void {
    const defaults = range ?? defaultsFor(this.state.weekStart());
    this.sessionError.set(null);
    this.sessionDraft.set({ date: defaults.date, startTime: defaults.startTime });
  }

  protected closeSessionForm(): void {
    this.sessionDraft.set(null);
    this.sessionError.set(null);
  }

  /** Crée la séance puis ouvre sa fiche (story #10). */
  protected async onSessionSaved(body: CreateSessionRequestApi): Promise<void> {
    this.sessionError.set(null);
    this.sessionSaving.set(true);
    try {
      const created = await new Promise<{ id: string }>((resolve, reject) =>
        this.sessionsWrite.create(body).subscribe({ next: resolve, error: reject }),
      );
      this.sessionDraft.set(null);
      this.messages.success('Séance créée.');
      void this.router.navigate(['/seances', created.id]);
    } catch (error) {
      this.sessionError.set(error instanceof AppError ? error : toAppError(error));
    } finally {
      this.sessionSaving.set(false);
    }
  }

  /**
   * Enregistre un déplacement fait à la souris. Un créneau se déplace pour toute sa série, une séance ponctuelle
   * avec sa date et son heure. En cas d'erreur, le back a déjà notifié l'erreur ; la semaine est rechargée.
   */
  protected async onMoved(move: GridMove): Promise<void> {
    if (move.kind === 'session' && move.session.recurrence === 'hebdomadaire') {
      // Une séance hebdomadaire : demander s'il faut déplacer cette semaine seulement ou toute la série.
      this.pendingMove.set(move);
      return;
    }
    try {
      if (move.kind === 'slot') {
        await this.state.update(move.slot.id, {
          type: move.slot.type,
          date: move.date,
          startTime: move.startTime,
          endTime: move.endTime,
          recurrence: move.slot.recurrence,
        });
      } else {
        await firstValueFrom(
          this.sessionsWrite.move(move.session.id, { date: move.date, startTime: move.startTime }),
        );
        this.state.reload();
      }
      this.messages.success('Élément déplacé.');
    } catch {
      this.state.reload();
    }
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
      'Cette occurrence a été déplacée.',
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
      'La série a été déplacée.',
    );
  }

  protected cancelPendingMove(): void {
    this.pendingMove.set(null);
    this.state.reload();
  }

  /** Annule cette occurrence seulement. */
  protected async cancelThisOccurrence(): Promise<void> {
    const session = this.occurrenceChoice();
    this.occurrenceChoice.set(null);
    if (session === null) {
      return;
    }
    await this.runOccurrenceAction(
      () => firstValueFrom(this.sessionsWrite.cancelOccurrence(session.id, session.date)),
      'Cette occurrence est annulée.',
    );
  }

  /** Restaure cette occurrence à sa programmation initiale. */
  protected async restoreThisOccurrence(): Promise<void> {
    const session = this.occurrenceChoice();
    this.occurrenceChoice.set(null);
    if (session === null) {
      return;
    }
    await this.runOccurrenceAction(
      () => firstValueFrom(this.sessionsWrite.restoreOccurrence(session.id, session.date)),
      'Cette occurrence est restaurée.',
    );
  }

  /** Ouvre la fiche de la séance depuis le choix d'une occurrence. */
  protected openSessionFromChoice(): void {
    const session = this.occurrenceChoice();
    this.occurrenceChoice.set(null);
    if (session !== null) {
      void this.router.navigate(['/seances', session.id]);
    }
  }

  /**
   * Ouvre la fiche de la séance (story #10). Une séance hebdomadaire ouvre d'abord le choix : fiche,
   * annulation ou restauration de cette semaine.
   */
  protected openSession(session: SessionOccurrence): void {
    if (session.recurrence === 'hebdomadaire') {
      this.occurrenceChoice.set(session);
      return;
    }
    void this.router.navigate(['/seances', session.id]);
  }

  /** Exécute une action sur une occurrence, puis recharge la semaine. L'erreur est notifiée par l'intercepteur. */
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

  protected openEdit(slot: Slot): void {
    this.formError.set(null);
    this.editing.set(slot);
  }

  protected closeForm(): void {
    this.editing.set(null);
    this.formError.set(null);
  }

  protected onSaved(input: SlotInput): void {
    void this.save(input);
  }

  protected confirmDelete(): void {
    const target = this.formSlot();
    if (target === null) {
      return;
    }
    this.modal.confirm({
      nzTitle: 'Supprimer ce créneau ?',
      nzContent:
        target.recurrence === 'hebdomadaire'
          ? 'La suppression efface toute la série, qui se répète chaque semaine.'
          : 'Cette action est définitive.',
      nzOkText: 'Supprimer',
      nzOkDanger: true,
      nzCancelText: 'Annuler',
      nzOnOk: () => this.remove(target),
    });
  }

  private async save(input: SlotInput): Promise<void> {
    const target = this.editing();
    if (target === null) {
      return;
    }

    this.formError.set(null);
    try {
      if (target === 'new') {
        await this.state.create(input);
      } else {
        await this.state.update(target.id, input);
      }
    } catch (error) {
      this.formError.set(error instanceof AppError ? error : toAppError(error));
      return;
    }

    this.closeForm();
    this.messages.success(target === 'new' ? 'Créneau créé.' : 'Créneau modifié.');
  }

  private async remove(slot: Slot): Promise<void> {
    try {
      await this.state.remove(slot.id);
    } catch (error) {
      this.formError.set(error instanceof AppError ? error : toAppError(error));
      return;
    }
    this.closeForm();
    this.messages.success('Créneau supprimé.');
  }
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
