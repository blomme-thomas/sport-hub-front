import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { SessionModulesComponent } from '../components/session-modules.component';
import { SessionState } from '../data-access/session.state';
import type { ModuleType, SessionStatus } from '../models/session.model';

const STATUS_LABELS: Record<SessionStatus, string> = {
  planifiee: 'Planifiée',
  realisee: 'Réalisée',
  manquee: 'Manquée',
};

/**
 * Fiche d'une séance : informations, modules dans l'ordre et édition des modules. La séance est chargée
 * à l'ouverture ; une séance réalisée reste en lecture seule. `id` vient du paramètre de route.
 */
@Component({
  selector: 'sh-session-page',
  imports: [NzButtonComponent, SessionModulesComponent],
  templateUrl: './session.page.html',
  styleUrl: './session.page.scss',
  providers: [SessionState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionPage implements OnInit {
  readonly id = input.required<string>();

  protected readonly state = inject(SessionState);
  private readonly messages = inject(NzMessageService);

  protected readonly dateLabel = computed(() => {
    const session = this.state.session();
    return session === null ? '' : formatDay(session.date);
  });
  protected readonly statusLabel = computed(() => {
    const status = this.state.session()?.status;
    return status === undefined ? '' : STATUS_LABELS[status];
  });

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

  protected move(event: { key: number; delta: -1 | 1 }): void {
    if (event.delta === -1) {
      this.state.moveUp(event.key);
    } else {
      this.state.moveDown(event.key);
    }
  }

  protected async save(): Promise<void> {
    const saved = await this.state.save();
    if (saved) {
      this.messages.success('Séance modifiée.');
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
