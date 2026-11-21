import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import { countSessions } from '../../../../shared/plan-seances/plan-seances.parser';
import { JsonFileInputComponent } from '../../../../shared/ui/json-file-input/json-file-input.component';

/**
 * Import de plusieurs séances depuis un fichier `plan-seances`. Le front compte les séances sans les valider :
 * la validation est faite par le back, qui refuse le fichier entier en cas d'erreur. Le contenu JSON part tel quel.
 */
@Component({
  selector: 'sh-session-import',
  imports: [NzButtonComponent, JsonFileInputComponent],
  templateUrl: './session-import.component.html',
  styleUrl: './session-import.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionImportComponent {
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<unknown>();
  readonly cancelled = output<void>();

  private readonly content = signal('');
  /** `null` tant qu'aucun contenu n'est saisi. */
  protected readonly result = computed(() => {
    const text = this.content();
    return text.trim() === '' ? null : countSessions(text);
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
