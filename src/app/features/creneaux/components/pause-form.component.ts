import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { PAUSE_REASON_LABELS, type PauseInput, type PauseReason } from '../models/pause.model';

/** Valeurs initiales du formulaire : création (dates pré-remplies) ou modification d'une pause. */
export interface PauseDraft {
  startDate: string;
  endDate: string;
  reason: PauseReason;
}

const REASONS: readonly PauseReason[] = ['blessure', 'vacances', 'autre'];

/**
 * Formulaire de création ou de modification d'une pause. La fin ne peut pas précéder le début : l'erreur est
 * signalée avant tout envoi. Présentationnel : ne fait aucun appel, émet la saisie.
 */
@Component({
  selector: 'sh-pause-form',
  imports: [ReactiveFormsModule, NzButtonComponent],
  templateUrl: './pause-form.component.html',
  styleUrl: './pause-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PauseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly draft = input.required<PauseDraft>();
  readonly submitting = input(false);
  /** Message renvoyé par le back, affiché sous le formulaire. */
  readonly serverError = input<string | null>(null);

  readonly saved = output<PauseInput>();
  readonly cancelled = output<void>();

  protected readonly reasons = REASONS;
  protected readonly reasonLabels = PAUSE_REASON_LABELS;

  protected readonly form = this.fb.nonNullable.group({
    startDate: ['', [Validators.required]],
    endDate: ['', [Validators.required]],
    reason: ['autre' as PauseReason, [Validators.required]],
  });

  /** Les valeurs de départ arrivent par l'input `draft`, une fois le composant créé. */
  ngOnInit(): void {
    this.form.setValue(this.draft());
  }

  /** Vrai quand la fin précède le début : le message s'affiche et l'envoi est bloqué. */
  protected get endsBeforeStart(): boolean {
    const { startDate, endDate } = this.form.getRawValue();
    return startDate !== '' && endDate !== '' && endDate < startDate;
  }

  protected submit(): void {
    if (this.form.invalid || this.endsBeforeStart || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue());
  }
}
