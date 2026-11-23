import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { SessionModalService } from '@core/layout/session-modal.service';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ActivityCommentComponent } from '../components/activity-comment/activity-comment.component';
import {
  SessionEditFormComponent,
  type SessionDetailsSave,
} from '../components/session-edit-form/session-edit-form.component';
import { SessionActivityComponent } from '../components/session-activity/session-activity.component';
import { SessionModulesComponent } from '../components/session-modules/session-modules.component';
import { SessionObjectivesComponent } from '../components/session-objectives/session-objectives.component';
import { ActivityCommentState } from '../data-access/activity-comment.state';
import { SessionState } from '../data-access/session.state';
import type { ModuleType, SessionStatus } from '../models/session.model';
import { fill, TEXTS } from '@shared/texts/texts';

const STATUS_LABELS: Record<SessionStatus, string> = {
  planifiee: TEXTS.seances.statusLabels.planifiee,
  realisee: TEXTS.seances.statusLabels.realisee,
  manquee: TEXTS.seances.statusLabels.manquee,
};

/**
 * Fiche d'une séance : informations, modules dans l'ordre et édition des modules. La séance est chargée
 * à l'ouverture ; une séance réalisée reste en lecture seule. `id` vient du paramètre de route.
 */
@Component({
  selector: 'sh-session-page',
  imports: [
    NzButtonComponent,
    ModalComponent,
    ActivityCommentComponent,
    SessionActivityComponent,
    SessionEditFormComponent,
    SessionModulesComponent,
    SessionObjectivesComponent,
  ],
  templateUrl: './session.page.html',
  styleUrl: './session.page.scss',
  providers: [SessionState, ActivityCommentState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPage implements OnInit {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly id = input.required<string>();

  protected readonly state = inject(SessionState);
  protected readonly comments = inject(ActivityCommentState);
  private readonly messages = inject(NzMessageService);
  private readonly modal = inject(NzModalService);
  private readonly sessionModal = inject(SessionModalService);

  protected readonly dateLabel = computed(() => {
    const session = this.state.session();
    return session === null ? '' : formatDay(session.date);
  });
  protected readonly statusLabel = computed(() => {
    const status = this.state.session()?.status;
    return status === undefined ? '' : STATUS_LABELS[status];
  });

  constructor() {
    // Titre de la modale de la fiche : le titre de la séance, à défaut sa discipline.
    effect(() => {
      const session = this.state.session();
      this.sessionModal.title.set(
        session === null ? null : (session.title ?? session.disciplineLabel),
      );
    });
  }

  ngOnInit(): void {
    void this.state.load(this.id());
  }

  protected setType(event: { key: number; type: ModuleType }): void {
    this.state.setType(event.key, event.type);
  }

  protected setDuration(event: { key: number; minutes: number }): void {
    this.state.setDuration(event.key, event.minutes);
  }

  protected setInstruction(event: { key: number; instruction: string }): void {
    this.state.setInstruction(event.key, event.instruction);
  }

  protected reorder(event: { key: number; toIndex: number }): void {
    this.state.moveTo(event.key, event.toIndex);
  }

  protected async linkActivity(activityId: string): Promise<void> {
    if (await this.state.linkActivity(activityId)) {
      this.messages.success(TEXTS.seances.activity.linked);
    }
  }

  protected async unlinkActivity(): Promise<void> {
    if (await this.state.unlinkActivity()) {
      this.messages.success(TEXTS.seances.activity.unlinked);
    }
  }

  protected async saveComment(): Promise<void> {
    if (await this.comments.save()) {
      this.messages.success(TEXTS.seances.comment.saved);
    }
  }

  protected async save(): Promise<void> {
    const saved = await this.state.save();
    if (saved) {
      this.messages.success(TEXTS.seances.messages.modified);
    }
  }

  /** Fenêtre de modification de la séance (story #134) ; fermée tant qu'elle n'est pas enregistrée. */
  protected readonly editOpen = signal(false);

  protected openEdit(): void {
    this.editOpen.set(true);
  }

  protected closeEdit(): void {
    this.editOpen.set(false);
  }

  /** Demande confirmation puis supprime la séance ; une série hebdomadaire est supprimée en entier. */
  protected confirmDelete(): void {
    const session = this.state.session();
    if (session === null) {
      return;
    }
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
      nzOnOk: async () => {
        if (await this.state.delete()) {
          this.sessionModal.markDeleted();
          this.messages.success(TEXTS.creneaux.session.deleted);
        }
      },
    });
  }

  protected async saveDetails(event: SessionDetailsSave): Promise<void> {
    if (await this.state.saveDetails(event.details, event.modules)) {
      this.editOpen.set(false);
      this.messages.success(TEXTS.seances.messages.modified);
    }
  }
}

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}
