import { ChangeDetectionStrategy, Component, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../core/http/app-error';
import {
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
} from '../../../shared/utils/session-limits';
import type { CreateSessionRequestApi } from '../data-access/sessions-write.api';

export interface SessionDefaults {
  date: string;
  startTime: string;
}

export interface DisciplineOption {
  typeKey: string;
  label: string;
}

/**
 * Formulaire de création d'une séance depuis le calendrier : date, heure, discipline, durée, récurrence et
 * informations facultatives. Émet le corps de création ; les erreurs du back sont affichées en alerte.
 */
@Component({
  selector: 'sh-session-form',
  imports: [ReactiveFormsModule, NzButtonComponent],
  templateUrl: './session-form.component.html',
  styleUrl: './session-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionFormComponent implements OnInit {
  readonly defaults = input.required<SessionDefaults>();
  readonly disciplines = input<readonly DisciplineOption[]>([]);
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<CreateSessionRequestApi>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly maxDuration = MAX_DURATION_MINUTES;

  protected readonly form = this.fb.group({
    date: this.fb.control('', [Validators.required]),
    startTime: this.fb.control('', [Validators.required]),
    durationMinutes: this.fb.control(60, [
      Validators.required,
      Validators.min(MIN_DURATION_MINUTES),
      Validators.max(MAX_DURATION_MINUTES),
    ]),
    disciplineTypeKey: this.fb.control('', [Validators.required]),
    recurrence: this.fb.control<'aucune' | 'hebdomadaire'>('aucune'),
    description: this.fb.control(''),
    equipment: this.fb.control(''),
    attentionPoints: this.fb.control(''),
  });

  ngOnInit(): void {
    const defaults = this.defaults();
    this.form.patchValue({ date: defaults.date, startTime: defaults.startTime });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      date: value.date,
      startTime: value.startTime,
      durationMinutes: Number(value.durationMinutes),
      disciplineTypeKey: value.disciplineTypeKey,
      recurrence: value.recurrence,
      description: value.description.trim() || undefined,
      equipment: value.equipment.trim() || undefined,
      attentionPoints: value.attentionPoints.trim() || undefined,
    });
  }
}
