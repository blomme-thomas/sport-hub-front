import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import { JsonFileInputComponent } from '../../../../shared/ui/json-file-input/json-file-input.component';
import { fill, TEXTS } from '@shared/texts/texts';
import { countPlanItems } from '../../config/plan-import';
import type { PlanImportKind } from '../../models/plan-import.model';

/**
 * Import d'un fichier `plan-aliments` ou `plan-recettes` depuis une modale. Le front compte les éléments sans les
 * valider : la validation est faite par le back, qui refuse le fichier entier en cas d'erreur.
 */
@Component({
  selector: 'sh-plan-import',
  imports: [NzButtonComponent, JsonFileInputComponent],
  templateUrl: './plan-import.component.html',
  styleUrl: './plan-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanImportComponent {
  readonly kind = input.required<PlanImportKind>();
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<unknown>();
  readonly cancelled = output<void>();

  protected readonly t = TEXTS;
  protected readonly fill = fill;

  private readonly content = signal('');
  /** `null` tant qu'aucun contenu n'est saisi. */
  protected readonly result = computed(() => {
    const text = this.content();
    return text.trim() === '' ? null : countPlanItems(text, this.kind());
  });
  protected readonly canSubmit = computed(() => {
    const result = this.result();
    return result !== null && result.ok && !this.submitting();
  });

  protected onContent(text: string): void {
    this.content.set(text);
  }

  /** Soumission native : le formulaire n'importe pas FormsModule, donc pas de `ngSubmit`. */
  protected submit(event: Event): void {
    event.preventDefault();
    const result = this.result();
    if (result === null || !result.ok || this.submitting()) {
      return;
    }
    this.saved.emit(result.content);
  }
}
