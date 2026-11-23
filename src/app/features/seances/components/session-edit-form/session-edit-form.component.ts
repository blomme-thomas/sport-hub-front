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
import type {
  PlanSeanceIssue,
  PlanSeanceModule,
} from '../../../../shared/plan-seances/plan-seances.model';
import { PlanModulesEditorComponent } from '../../../../shared/ui/plan-modules-editor/plan-modules-editor.component';
import {
  createSessionNutritionForm,
  patchSessionNutrition,
  readSessionNutrition,
} from '../../../../shared/nutrition/session-nutrition';
import { SessionNutritionFieldsComponent } from '../../../../shared/ui/session-nutrition-fields/session-nutrition-fields.component';
import { JsonFileInputComponent } from '../../../../shared/ui/json-file-input/json-file-input.component';
import {
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
} from '../../../../shared/utils/session-limits';
import type { UpdateSessionRequestApi } from '../../models/session.api-model';
import type { Session } from '../../models/session.model';
import { fill, TEXTS } from '@shared/texts/texts';

const DESCRIPTION_MAX_LENGTH = 2000;
const TITLE_MAX_LENGTH = 200;
const ZONE_KEYS = ['z1', 'z2', 'z3', 'z4', 'z5'] as const;

/** Valeurs des cases Z1 à Z5 à partir de la liste de l'API ou du fichier. */
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

export interface SessionDisciplineOption {
  typeKey: string;
  label: string;
}

/** Ce qui est enregistré : les champs de la séance, et les modules si un fichier JSON en a fourni. */
export interface SessionDetailsSave {
  details: UpdateSessionRequestApi;
  modules: PlanSeanceModule[] | null;
}

/**
 * Formulaire de modification d'une séance planifiée : date, heure, durée, discipline et description. Un fichier
 * JSON (une seule séance) pré-remplit les champs présents ; rien n'est enregistré avant « Enregistrer ».
 */
@Component({
  selector: 'sh-session-edit-form',
  imports: [
    ReactiveFormsModule,
    NzButtonComponent,
    JsonFileInputComponent,
    PlanModulesEditorComponent,
    SessionNutritionFieldsComponent,
  ],
  templateUrl: './session-edit-form.component.html',
  styleUrl: './session-edit-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionEditFormComponent implements OnInit {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly session = input.required<Session>();
  readonly disciplines = input<readonly SessionDisciplineOption[]>([]);
  readonly saving = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<SessionDetailsSave>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly durationMin = MIN_DURATION_MINUTES;
  protected readonly durationMax = MAX_DURATION_MINUTES;
  protected readonly descriptionMax = DESCRIPTION_MAX_LENGTH;

  protected readonly form = this.fb.group({
    date: this.fb.control('', [Validators.required]),
    startTime: this.fb.control('', [Validators.required]),
    durationMinutes: this.fb.control(MIN_DURATION_MINUTES, [
      Validators.required,
      Validators.min(MIN_DURATION_MINUTES),
      Validators.max(MAX_DURATION_MINUTES),
    ]),
    disciplineTypeKey: this.fb.control('', [Validators.required]),
    title: this.fb.control('', [Validators.maxLength(TITLE_MAX_LENGTH)]),
    distanceKm: this.fb.control<number | null>(null),
    zones: this.fb.group({
      z1: this.fb.control<number | null>(0),
      z2: this.fb.control<number | null>(0),
      z3: this.fb.control<number | null>(0),
      z4: this.fb.control<number | null>(0),
      z5: this.fb.control<number | null>(0),
    }),
    description: this.fb.control('', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]),
  });

  /** Glucides et hydratation : groupe à part, relu à l'ouverture et à l'envoi. */
  protected readonly nutritionForm = createSessionNutritionForm(inject(FormBuilder));

  protected readonly zoneFields = [
    { key: 'z1', label: TEXTS.seances.edit.zones.z1 },
    { key: 'z2', label: TEXTS.seances.edit.zones.z2 },
    { key: 'z3', label: TEXTS.seances.edit.zones.z3 },
    { key: 'z4', label: TEXTS.seances.edit.zones.z4 },
    { key: 'z5', label: TEXTS.seances.edit.zones.z5 },
  ] as const;

  /** Total des zones saisies : 0 (inchangées) ou 100 (valide). */
  protected readonly zoneTotal = computed(() => {
    const zones = this.form.getRawValue().zones;
    return ZONE_KEYS.reduce((sum, key) => sum + (zones[key] ?? 0), 0);
  });
  protected readonly zonesInvalid = computed(() => {
    const total = this.zoneTotal();
    return total !== 0 && total !== 100;
  });

  protected readonly importIssues = signal<readonly PlanSeanceIssue[]>([]);
  protected readonly importSummary = signal<string | null>(null);
  /** Modules du fichier JSON, `null` s'il n'y en a pas : les modules déjà enregistrés sont alors conservés. */
  private readonly importedModules = signal<readonly PlanSeanceModule[] | null>(null);
  protected readonly editedModules = this.importedModules.asReadonly();
  /** Un module hors bornes, ou une liste vidée, bloque l’enregistrement : une séance garde au moins un module. */
  protected readonly modulesInvalid = computed(() => {
    const modules = this.importedModules();
    return (
      modules !== null &&
      (modules.length === 0 || modules.some((module) => !isPlanModuleValid(module)))
    );
  });

  protected onModulesChange(modules: PlanSeanceModule[]): void {
    this.importedModules.set(modules);
  }

  /** Discipline de la séance en tête si elle n'est pas (ou plus) dans le référentiel, pour ne pas la perdre. */
  protected readonly disciplineOptions = computed<readonly SessionDisciplineOption[]>(() => {
    const session = this.session();
    const options = this.disciplines();
    return options.some((option) => option.typeKey === session.disciplineTypeKey)
      ? options
      : [{ typeKey: session.disciplineTypeKey, label: session.disciplineLabel }, ...options];
  });

  private readonly knownKeys = computed(() =>
    this.disciplines().length === 0
      ? undefined
      : new Set(this.disciplines().map((option) => option.typeKey)),
  );

  ngOnInit(): void {
    const session = this.session();
    patchSessionNutrition(this.nutritionForm, session.nutrition);
    this.form.setValue({
      date: session.date,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      disciplineTypeKey: session.disciplineTypeKey,
      description: session.description ?? '',
      title: session.title ?? '',
      distanceKm:
        session.objectives.distanceMeters === null
          ? null
          : session.objectives.distanceMeters / 1000,
      zones: zonesControls(session.objectives.zonePercentages ?? [0, 0, 0, 0, 0]),
    });
  }

  /** Un JSON valide pré-remplit les champs présents ; un JSON invalide laisse le formulaire intact. */
  protected onJsonChange(text: string): void {
    if (text.trim() === '') {
      this.importIssues.set([]);
      this.importSummary.set(null);
      return;
    }
    const result = parseSingleSession(text, this.knownKeys());
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
    this.importSummary.set(fill(TEXTS.seances.edit.prefilled, { count: prefill.modules.length }));
  }

  protected submit(): void {
    if (this.nutritionForm.invalid) {
      this.nutritionForm.markAllAsTouched();
      return;
    }
    if (this.form.invalid || this.modulesInvalid() || this.zonesInvalid()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const modules = this.importedModules();
    const startTime = value.startTime.trim();
    const description = value.description.trim();
    const title = value.title.trim();
    const zones = ZONE_KEYS.map((key) => value.zones[key] ?? 0);
    this.saved.emit({
      details: {
        date: value.date,
        startTime,
        durationMinutes: Number(value.durationMinutes),
        disciplineTypeKey: value.disciplineTypeKey,
        title: title === '' ? null : title,
        description: description === '' ? null : description,
        targetDistanceMeters:
          value.distanceKm === null ? null : Math.round(value.distanceKm * 1000),
        // Zones à 0 partout : répartition inchangée (le back n'accepte pas de la vider).
        ...(this.zoneTotal() === 100 && { targetHrZonePercentages: zones }),
        // Champs vides : envoyés à null, ce qui efface la valeur enregistrée.
        ...readSessionNutrition(this.nutritionForm),
      },
      modules: modules === null ? null : [...modules],
    });
  }
}
