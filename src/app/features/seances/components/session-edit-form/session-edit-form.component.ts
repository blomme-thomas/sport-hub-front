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
import { JsonFileInputComponent } from '../../../../shared/ui/json-file-input/json-file-input.component';
import {
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
} from '../../../../shared/utils/session-limits';
import type { UpdateSessionRequestApi } from '../../models/session.api-model';
import type { Session } from '../../models/session.model';

const DESCRIPTION_MAX_LENGTH = 2000;

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
  ],
  templateUrl: './session-edit-form.component.html',
  styleUrl: './session-edit-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionEditFormComponent implements OnInit {
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
    startTime: this.fb.control(''),
    durationMinutes: this.fb.control(MIN_DURATION_MINUTES, [
      Validators.required,
      Validators.min(MIN_DURATION_MINUTES),
      Validators.max(MAX_DURATION_MINUTES),
    ]),
    disciplineTypeKey: this.fb.control('', [Validators.required]),
    description: this.fb.control('', [Validators.maxLength(DESCRIPTION_MAX_LENGTH)]),
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
    this.form.setValue({
      date: session.date,
      startTime: session.startTime ?? '',
      durationMinutes: session.durationMinutes,
      disciplineTypeKey: session.disciplineTypeKey,
      description: session.description ?? '',
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
    });
    this.importedModules.set(prefill.modules);
    this.importSummary.set(
      `Valeurs pré-remplies, avec ${prefill.modules.length} module(s). Relisez puis enregistrez.`,
    );
  }

  protected submit(): void {
    if (this.form.invalid || this.modulesInvalid()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const modules = this.importedModules();
    const startTime = value.startTime.trim();
    const description = value.description.trim();
    this.saved.emit({
      details: {
        date: value.date,
        startTime: startTime === '' ? null : startTime,
        durationMinutes: Number(value.durationMinutes),
        disciplineTypeKey: value.disciplineTypeKey,
        description: description === '' ? null : description,
      },
      modules: modules === null ? null : [...modules],
    });
  }
}
