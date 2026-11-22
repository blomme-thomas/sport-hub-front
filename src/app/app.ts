import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionModalService } from './core/layout/session-modal.service';
import { ShellComponent } from './core/layout/shell.component';
import { ModalComponent } from './shared/ui/modal/modal.component';
import { SessionPage } from './features/seances/pages/session.page';
import { TEXTS } from '@shared/texts/texts';

/** Racine : la coque, et la fiche d'une séance ouverte en modale depuis n'importe quelle page (sans changer de route). */
@Component({
  selector: 'sh-root',
  imports: [ShellComponent, ModalComponent, SessionPage],
  template: `
    <sh-shell />

    @if (sessionModal.sessionId(); as id) {
      @defer (on immediate) {
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
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly t = TEXTS;
  protected readonly sessionModal = inject(SessionModalService);
}
