import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../core/http/app-error';
import {
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
} from '../../../shared/utils/session-limits';
import {
  HR_ZONES,
  validateObjectives,
  type ObjectiveErrorKey,
} from '../../../shared/utils/session-objectives';
import type { CreateSessionRequestApi } from '../data-access/sessions-write.api';

const ZONE_KEYS = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

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
  /** Vrai après la première tentative de création : c'est alors que les erreurs d'objectifs s'affichent. */
  private readonly submitted = signal(false);

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
    distanceKm: this.fb.control<number | null>(null),
    zones: this.fb.group({
      z1: this.fb.control<number | null>(0),
      z2: this.fb.control<number | null>(0),
      z3: this.fb.control<number | null>(0),
      z4: this.fb.control<number | null>(0),
      z5: this.fb.control<number | null>(0),
    }),
    description: this.fb.control(''),
    equipment: this.fb.control(''),
    attentionPoints: this.fb.control(''),
  });

  protected readonly zoneFields = HR_ZONES.map((zone, index) => ({
    key: ZONE_KEYS[index] ?? 'z1',
    label: zone.label,
  }));

  /** Erreurs des objectifs, affichées seulement après une tentative de création. */
  protected get objectiveErrors(): Partial<Record<ObjectiveErrorKey, string>> {
    return this.submitted() ? this.computeObjectiveErrors() : {};
  }

  private computeObjectiveErrors(): Partial<Record<ObjectiveErrorKey, string>> {
    const value = this.form.getRawValue();
    return validateObjectives({
      distanceMeters: value.distanceKm === null ? null : value.distanceKm * 1000,
      zonePercentages: ZONE_KEYS.map((key) => value.zones[key]),
    });
  }

  /** Total saisi pour les zones, affiché sous la répartition. */
  protected get zoneTotal(): number {
    const zones = this.form.getRawValue().zones;
    return ZONE_KEYS.reduce((sum, key) => sum + (zones[key] ?? 0), 0);
  }

  ngOnInit(): void {
    const defaults = this.defaults();
    this.form.patchValue({ date: defaults.date, startTime: defaults.startTime });
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || Object.keys(this.computeObjectiveErrors()).length > 0) {
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
      ...(value.distanceKm !== null && {
        targetDistanceMeters: Math.round(value.distanceKm * 1000),
      }),
      targetHrZonePercentages: ZONE_KEYS.map((key) => value.zones[key] ?? 0),
      description: value.description.trim() || undefined,
      equipment: value.equipment.trim() || undefined,
      attentionPoints: value.attentionPoints.trim() || undefined,
    });
  }
}
