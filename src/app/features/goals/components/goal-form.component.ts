import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import {
  NZ_DATE_CONFIG,
  NZ_DATE_CONFIG_DEFAULT,
  NZ_DATE_LOCALE,
  NativeDateAdapter,
  NzDateAdapter,
} from 'ng-zorro-antd/core/time';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { NzInputDirective } from 'ng-zorro-antd/input';
import { NzInputNumberComponent } from 'ng-zorro-antd/input-number';
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { AppError } from '../../../core/http/app-error';
import { SelectComboboxDirective } from '../../../shared/directives/select-combobox.directive';
import { EVENT_FORMATS, GOAL_TYPES } from '../models/goal-options';
import type { EventFormat, Goal, GoalInput, GoalType } from '../models/goal.model';

type FormFieldName = 'title' | 'type' | 'targetDate' | 'eventFormat' | 'targetTimeSeconds';

const FORM_FIELDS: Readonly<Record<FormFieldName, true>> = {
  title: true,
  type: true,
  targetDate: true,
  eventFormat: true,
  targetTimeSeconds: true,
};

const EVENT_TYPE: GoalType = 'evenement';
const REQUIRED_MESSAGE = 'Ce champ est obligatoire.';

const notBlank = (control: AbstractControl): ValidationErrors | null =>
  typeof control.value === 'string' && control.value.trim() === '' ? { required: true } : null;

/**
 * Formulaire de création ou de modification d'un objectif. Émet une `GoalInput` à l'enregistrement
 * lorsque la saisie est valide côté client. Les erreurs renvoyées par le back sont affichées près du
 * champ concerné ; celles qui ne visent aucun champ, ou un message global, sont listées en alerte.
 */
@Component({
  selector: 'sh-goal-form',
  imports: [
    ReactiveFormsModule,
    NzButtonComponent,
    NzDatePickerComponent,
    NzInputDirective,
    NzInputNumberComponent,
    NzOptionComponent,
    NzSelectComponent,
    SelectComboboxDirective,
  ],
  providers: [
    { provide: NzDateAdapter, useClass: NativeDateAdapter },
    { provide: NZ_DATE_CONFIG, useValue: NZ_DATE_CONFIG_DEFAULT },
    { provide: NZ_DATE_LOCALE, useValue: 'fr-FR' },
  ],
  templateUrl: './goal-form.component.html',
  styleUrl: './goal-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalFormComponent implements OnInit {
  readonly goal = input<Goal | null>(null);
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<GoalInput>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly typeOptions = GOAL_TYPES;
  protected readonly formatOptions = EVENT_FORMATS;

  protected readonly form = this.fb.group({
    title: this.fb.control('', [Validators.required, notBlank]),
    type: this.fb.control<GoalType>(EVENT_TYPE),
    targetDate: this.fb.control<Date | null>(null),
    eventFormat: this.fb.control<EventFormat | null>(null),
    targetTimeSeconds: this.fb.group({
      hours: this.fb.control<number | null>(null),
      minutes: this.fb.control<number | null>(null),
      seconds: this.fb.control<number | null>(null),
    }),
  });

  private readonly typeValue = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });
  protected readonly isEvent = computed(() => this.typeValue() === EVENT_TYPE);

  private readonly serverMessages = computed(() => {
    const messages = new Map<FormFieldName, string>();
    for (const fieldError of this.serverError()?.fieldErrors ?? []) {
      if (isFormField(fieldError.field)) {
        const previous = messages.get(fieldError.field);
        messages.set(
          fieldError.field,
          previous === undefined ? fieldError.message : `${previous} ${fieldError.message}`,
        );
      }
    }
    return messages;
  });

  protected readonly alertMessages = computed<readonly string[]>(() => {
    const error = this.serverError();
    if (error === null) {
      return [];
    }
    const orphans = error.fieldErrors
      .filter((fieldError) => !isFormField(fieldError.field))
      .map((fieldError) => fieldError.message);
    if (orphans.length > 0) {
      return orphans;
    }
    return error.fieldErrors.length === 0 ? [error.userMessage] : [];
  });

  ngOnInit(): void {
    const goal = this.goal();
    this.form.setValue({
      title: goal?.title ?? '',
      type: goal?.type ?? EVENT_TYPE,
      targetDate: toDate(goal?.targetDate ?? null),
      eventFormat: goal?.eventFormat ?? null,
      targetTimeSeconds: goal?.targetTime ?? { hours: null, minutes: null, seconds: null },
    });
  }

  protected errorOf(field: FormFieldName): string | null {
    const serverMessage = this.serverMessages().get(field);
    if (serverMessage !== undefined) {
      return serverMessage;
    }
    const control = this.form.get(field);
    return control?.hasError('required') && control.touched ? REQUIRED_MESSAGE : null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.toGoalInput());
  }

  private toGoalInput(): GoalInput {
    const value = this.form.getRawValue();
    return {
      title: value.title,
      type: value.type,
      targetDate: toIsoDate(value.targetDate),
      eventFormat: value.eventFormat,
      targetTime: value.targetTimeSeconds,
    };
  }
}

function isFormField(field: string): field is FormFieldName {
  return Object.hasOwn(FORM_FIELDS, field);
}

function toDate(iso: string | null): Date | null {
  if (iso === null) {
    return null;
  }
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

function toIsoDate(date: Date | null): string | null {
  if (date === null) {
    return null;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
