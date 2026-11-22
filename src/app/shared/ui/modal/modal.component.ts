import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzModalComponent, NzModalContentDirective } from 'ng-zorro-antd/modal';
import { TEXTS } from '@shared/texts/texts';
import { IconComponent, type IconName } from '../icon/icon.component';

/**
 * Modale de l'application : même fond, bordures, rayon et titre pour tous les écrans. Le contenu est projeté
 * dans la modale ; l'ouvrant décide de l'afficher (`@if`), et `closed` signale la fermeture (croix, Échap, clic
 * hors de la fenêtre). Les styles communs sont dans `_modal.scss`, importés globalement.
 */
@Component({
  selector: 'sh-modal',
  imports: [IconComponent, NzButtonComponent, NzModalComponent, NzModalContentDirective],
  template: `
    <nz-modal
      [nzVisible]="true"
      nzClassName="sh-modal"
      [nzWidth]="width()"
      [nzTitle]="titleTemplate"
      [nzFooter]="null"
      (nzOnCancel)="closed.emit()"
    >
      <ng-template #titleTemplate>
        <h2 class="sh-modal__title">
          @if (back()) {
            <button
              nz-button
              nzType="text"
              type="button"
              class="sh-modal__back"
              [attr.aria-label]="t.shared.modal.back"
              (click)="backRequested.emit()"
            >
              <sh-icon name="arrow-left" />
            </button>
          }
          @if (icon(); as name) {
            <sh-icon [name]="name" color="var(--sh-accent-text)" />
          }
          <span>{{ title() }}</span>
        </h2>
      </ng-template>
      <ng-container *nzModalContent>
        <ng-content />
      </ng-container>
    </nz-modal>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {
  protected readonly t = TEXTS;
  readonly title = input.required<string>();
  /** Pictogramme affiché devant le titre. */
  readonly icon = input<IconName | null>(null);
  readonly width = input('min(720px, 96vw)');
  /** Affiche une flèche « retour » à gauche du titre, si la vue précédente existe. */
  readonly back = input(false);

  readonly closed = output<void>();
  readonly backRequested = output<void>();
}
