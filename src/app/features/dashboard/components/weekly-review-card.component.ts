import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzModalService } from 'ng-zorro-antd/modal';
import { WeeklyReviewState } from '../data-access/weekly-review.state';

/**
 * Carte « Bilan de la semaine » : suivi, point d'attention et conseil de la semaine affichée.
 * Une semaine sans bilan propose de le générer ; régénérer remplace le bilan après confirmation.
 */
@Component({
  selector: 'sh-weekly-review-card',
  imports: [IconComponent, NzButtonComponent],
  templateUrl: './weekly-review-card.component.html',
  styleUrl: './weekly-review-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeeklyReviewCardComponent {
  protected readonly state = inject(WeeklyReviewState);
  private readonly modal = inject(NzModalService);

  protected readonly generatedLabel = computed(() => {
    const review = this.state.review();
    return review === null
      ? ''
      : new Date(review.generatedAt).toLocaleString('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
  });

  protected confirmRegenerate(): void {
    this.modal.confirm({
      nzTitle: 'Régénérer le bilan ?',
      nzContent: 'Le bilan actuel de cette semaine sera remplacé.',
      nzOkText: 'Régénérer',
      nzCancelText: 'Annuler',
      nzOnOk: () => this.state.generate(),
    });
  }
}
