import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  afterNextRender,
  inject,
} from '@angular/core';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { VariationBadgeComponent } from '../variation-badge/variation-badge.component';
import type { CardDetail } from '../../models/card-detail.model';

export interface CardDetailModalData {
  detail: CardDetail;
}

/**
 * Vue détaillée d'une carte du tableau de bord (story #91). Présentationnelle : reçoit un instantané
 * calculé à l'ouverture, sans appel au back. Échap ferme la modale (géré par ng-zorro), et le focus
 * revient à la carte. Ng-zorro n'associe pas le titre au dialogue : son nom est donc posé en `aria-label`.
 */
@Component({
  selector: 'sh-card-detail-modal',
  imports: [NzButtonComponent, VariationBadgeComponent],
  templateUrl: './card-detail-modal.component.html',
  styleUrl: './card-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDetailModalComponent {
  protected readonly data = inject<CardDetailModalData>(NZ_MODAL_DATA);
  private readonly modalRef = inject(NzModalRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    afterNextRender(() => {
      const dialog = this.host.nativeElement.closest('[role="dialog"]');
      if (dialog) {
        this.renderer.setAttribute(dialog, 'aria-label', this.data.detail.title);
      }
    });
  }

  protected close(): void {
    this.modalRef?.close();
  }
}
