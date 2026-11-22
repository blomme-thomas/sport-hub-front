import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SessionModalService } from './core/layout/session-modal.service';
import { ShellComponent } from './core/layout/shell.component';
import { SessionModalHostComponent } from './session-modal-host.component';

/** Racine : la coque, et la fiche d'une séance en modale (chargée seulement à l'ouverture). */
@Component({
  selector: 'sh-root',
  imports: [ShellComponent, SessionModalHostComponent],
  template: `
    <sh-shell />

    @defer (when sessionModal.sessionId() !== null) {
      <sh-session-modal-host />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly sessionModal = inject(SessionModalService);
}
