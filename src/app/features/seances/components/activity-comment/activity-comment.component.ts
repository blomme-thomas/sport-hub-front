import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import { renderMarkdown } from '../../../../shared/utils/markdown';
import type {
  ActivityCommentApi,
  ActivityCommentSourceApi,
} from '../../models/activity-comment.api-model';

const SOURCE_LABELS: Record<ActivityCommentSourceApi, string> = {
  ia: 'Généré par l’IA',
  generique: 'Commentaire générique',
  'saisie-manuelle': 'Saisi à la main',
};

/**
 * Bloc « Commentaire » de l'activité réalisée : affiche le commentaire en markdown, ou un champ de saisie
 * avec aperçu pour le modifier. Présentationnel : l'état vit dans `ActivityCommentState`.
 */
@Component({
  selector: 'sh-activity-comment',
  imports: [DatePipe, NzButtonComponent],
  templateUrl: './activity-comment.component.html',
  styleUrl: './activity-comment.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityCommentComponent {
  readonly comment = input<ActivityCommentApi | null>(null);
  readonly loading = input(false);
  readonly error = input<AppError | null>(null);
  readonly editing = input(false);
  readonly draft = input('');
  readonly saving = input(false);
  readonly saveError = input<AppError | null>(null);
  readonly canSave = input(false);

  readonly edit = output<void>();
  readonly cancelEdit = output<void>();
  readonly save = output<void>();
  readonly draftChange = output<string>();

  protected readonly renderedComment = computed(() => {
    const text = this.comment()?.text;
    return text ? renderMarkdown(text) : '';
  });

  protected readonly renderedDraft = computed(() => renderMarkdown(this.draft()));

  protected readonly sourceLabel = computed(() => {
    const source = this.comment()?.source;
    return source ? SOURCE_LABELS[source] : '';
  });

  protected onDraftInput(event: Event): void {
    this.draftChange.emit((event.target as HTMLTextAreaElement).value);
  }
}
