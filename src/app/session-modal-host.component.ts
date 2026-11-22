import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SessionModalService } from './core/layout/session-modal.service';
import { SessionPage } from './features/seances/pages/session.page';
import { TEXTS } from './shared/texts/texts';
import { ModalComponent } from './shared/ui/modal/modal.component';

/**
 * Fiche d'une séance en modale, par-dessus la page courante. Chargé à la première ouverture (voir `App`) : le
 * service de modale ng-zorro est fourni ici, pour rester hors du bundle de démarrage.
 */
@Component({
  selector: 'sh-session-modal-host',
  imports: [ModalComponent, SessionPage],
  providers: [NzModalService],
  template: `
    @if (sessionModal.sessionId(); as id) {
      <sh-modal
        [title]="sessionModal.title() ?? t.seances.title"
        width="min(960px, 96vw)"
        [back]="sessionModal.backToDay()"
        (backRequested)="sessionModal.close()"
        (closed)="sessionModal.close()"
      >
        <sh-session-page [id]="id" />
      </sh-modal>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionModalHostComponent {
  protected readonly t = TEXTS;
  protected readonly sessionModal = inject(SessionModalService);
}
