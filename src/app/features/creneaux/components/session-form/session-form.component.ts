import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../../core/http/app-error';
import {
  isPlanModuleValid,
  parseSingleSession,
  toPrefill,
  type SessionPrefill,
} from '../../../../shared/plan-seances/plan-seances.parser';
import {
  type PlanSeanceIssue,
  type PlanSeanceModule,
} from '../../../../shared/plan-seances/plan-seances.model';
import { PlanModulesEditorComponent } from '../../../../shared/ui/plan-modules-editor/plan-modules-editor.component';
import { JsonFileInputComponent } from '../../../../shared/ui/json-file-input/json-file-input.component';
import {
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
} from '../../../../shared/utils/session-limits';
import {
  HR_ZONES,
  validateObjectives,
  type ObjectiveErrorKey,
} from '../../../../shared/utils/session-objectives';
import type { CreateSessionRequestApi } from '../../data-access/sessions-write.api';
import { fill, TEXTS } from '@shared/texts/texts';

/** Durée proposée quand aucune plage n'est choisie sur la grille. */
const DEFAULT_DURATION_MINUTES = 60;

const ZONE_KEYS = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

export interface SessionDefaults {
  date: string;
  startTime: string;
  /** Fin de la plage choisie sur la grille : la durée par défaut en est l'écart. */
  endTime?: string;
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
  imports: [
    ReactiveFormsModule,
    NzButtonComponent,
    JsonFileInputComponent,
    PlanModulesEditorComponent,
  ],
  templateUrl: './session-form.component.html',
  styleUrl: './session-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionFormComponent implements OnInit {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
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
    title: this.fb.control(''),
    description: this.fb.control(''),
  });

  protected readonly zoneFields = HR_ZONES.map((zone, index) => ({
    key: ZONE_KEYS[index] ?? 'z1',
    label: zone.label,
  }));

  /** Erreurs du fichier JSON collé ou chargé, avec leur chemin ; le formulaire n'est pas modifié tant qu'il y en a. */
  protected readonly importIssues = signal<readonly PlanSeanceIssue[]>([]);
  protected readonly importSummary = signal<string | null>(null);
  /** Modules venus du fichier : envoyés à la création, affichés en récapitulatif. */
  protected readonly importedModules = signal<readonly PlanSeanceModule[]>([]);
  /** Vrai si un module modifié à la main sort des bornes du format : l'envoi est alors bloqué. */
  protected readonly modulesInvalid = computed(() =>
    this.importedModules().some((module) => !isPlanModuleValid(module)),
  );

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
    this.form.patchValue({
      date: defaults.date,
      startTime: defaults.startTime,
      durationMinutes:
        durationBetween(defaults.startTime, defaults.endTime) ?? DEFAULT_DURATION_MINUTES,
    });
  }

  /** Lit le fichier ou le texte collé : un JSON valide pré-remplit le formulaire, un JSON invalide le laisse intact. */
  protected onJsonChange(text: string): void {
    if (text.trim() === '') {
      this.importIssues.set([]);
      this.importSummary.set(null);
      return;
    }
    const result = parseSingleSession(text, this.knownDisciplineKeys());
    if (!result.ok) {
      this.importIssues.set(result.issues);
      this.importSummary.set(null);
      return;
    }
    this.importIssues.set([]);
    this.applyPrefill(toPrefill(result.seance));
  }

  private applyPrefill(prefill: SessionPrefill): void {
    this.form.patchValue({
      date: prefill.date,
      durationMinutes: prefill.durationMinutes,
      disciplineTypeKey: prefill.disciplineTypeKey,
      ...(prefill.startTime !== undefined && { startTime: prefill.startTime }),
      ...(prefill.description !== undefined && { description: prefill.description }),
      ...(prefill.title !== undefined && { title: prefill.title }),
      ...(prefill.targetDistanceMeters !== undefined && {
        distanceKm: prefill.targetDistanceMeters / 1000,
      }),
      ...(prefill.targetHrZonePercentages !== undefined && {
        zones: zonesControls(prefill.targetHrZonePercentages),
      }),
    });
    this.importedModules.set(prefill.modules);
    this.importSummary.set(
      fill(TEXTS.creneaux.session.prefilled, { count: prefill.modules.length }),
    );
  }

  /** Clés du référentiel pour contrôler la discipline du fichier ; sans référentiel, le contrôle est laissé au back. */
  private knownDisciplineKeys(): ReadonlySet<string> | undefined {
    const keys = this.disciplines();
    return keys.length === 0 ? undefined : new Set(keys.map((option) => option.typeKey));
  }

  protected submit(): void {
    this.submitted.set(true);
    if (this.form.invalid || Object.keys(this.computeObjectiveErrors()).length > 0) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const modules = this.importedModules();
    if (this.modulesInvalid()) {
      return;
    }
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
      title: value.title.trim() || undefined,
      description: value.description.trim() || undefined,
      ...(modules.length > 0 && { modules: [...modules] }),
    });
  }
}

/** Écart en minutes entre deux horaires `HH:mm`, ou `null` s'il est absent ou hors des bornes d'une séance. */
function durationBetween(start: string, end: string | undefined): number | null {
  if (end === undefined) {
    return null;
  }
  const toMinutes = (time: string): number => {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const diff = toMinutes(end) - toMinutes(start);
  return diff >= MIN_DURATION_MINUTES && diff <= MAX_DURATION_MINUTES ? diff : null;
}

/** Valeurs des cases Z1 à Z5 à partir de la liste du fichier. */
function zonesControls(values: readonly number[]): {
  z1: number;
  z2: number;
  z3: number;
  z4: number;
  z5: number;
} {
  const [z1 = 0, z2 = 0, z3 = 0, z4 = 0, z5 = 0] = values;
  return { z1, z2, z3, z4, z5 };
}
