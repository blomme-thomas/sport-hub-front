import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { ActivityComment } from '../../models/activity-comment.model';

/**
 * Bloc « Commentaire » du détail d'une activité : affiche le commentaire stocké, propose de le générer
 * s'il n'existe pas, et de le régénérer après confirmation. Présentation pure : l'état vit dans la modale.
 */
@Component({
  selector: 'sh-activity-comment',
  imports: [NzButtonComponent],
  templateUrl: './activity-comment.component.html',
  styleUrl: './activity-comment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCommentComponent {
  readonly comment = input<ActivityComment | null>(null);
  readonly loading = input(false);
  readonly generating = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly generate = output<void>();
  readonly regenerate = output<void>();
  readonly retry = output<void>();

  protected readonly confirming = signal(false);

  protected readonly sourceLabel = computed(() =>
    this.comment()?.generic
      ? 'Commentaire générique (aucune séance rapprochée)'
      : 'Généré par l’IA',
  );

  protected readonly generatedLabel = computed(() => {
    const comment = this.comment();
    return comment === null
      ? ''
      : new Date(comment.generatedAt).toLocaleString('fr-FR', {
          dateStyle: 'short',
          timeStyle: 'short',
        });
  });

  protected confirmRegenerate(): void {
    this.confirming.set(false);
    this.regenerate.emit();
  }
}
