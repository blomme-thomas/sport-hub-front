import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  OnInit,
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
import { NzOptionComponent, NzSelectComponent } from 'ng-zorro-antd/select';
import { AppError } from '../../../core/http/app-error';
import { SelectComboboxDirective } from '../../../shared/directives/select-combobox.directive';
import { isoDateToDate, dateToIsoDate } from '../../../shared/utils/iso-date';
import { SLOT_RECURRENCE_OPTIONS, SLOT_TYPE_OPTIONS } from '../models/slot-options';
import type { Slot, SlotDefaults, SlotInput, SlotRecurrence, SlotType } from '../models/slot.model';

type FormFieldName = 'type' | 'date' | 'startTime' | 'endTime' | 'recurrence';

const FORM_FIELDS: Readonly<Record<FormFieldName, true>> = {
  type: true,
  date: true,
  startTime: true,
  endTime: true,
  recurrence: true,
};

const REQUIRED_MESSAGE = 'Ce champ est obligatoire.';
const END_BEFORE_START_MESSAGE = 'L’heure de fin doit être postérieure à l’heure de début.';

/** Vrai quand la fin n'est pas strictement postérieure au début (comparaison de chaînes `HH:mm`). */
const endAfterStart = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('startTime')?.value;
  const end = group.get('endTime')?.value;
  return typeof start === 'string' &&
    typeof end === 'string' &&
    start !== '' &&
    end !== '' &&
    end <= start
    ? { endNotAfterStart: true }
    : null;
};

/**
 * Formulaire de création ou de modification d'un créneau. Émet une `SlotInput` lorsque la saisie est valide
 * côté client. Les erreurs renvoyées par le back sont affichées sous le champ concerné ; les autres sont listées
 * en alerte. La suppression est déléguée à la page (`deleted`).
 */
@Component({
  selector: 'sh-slot-form',
  imports: [
    ReactiveFormsModule,
    NzButtonComponent,
    NzDatePickerComponent,
    NzInputDirective,
    NzOptionComponent,
    NzSelectComponent,
    SelectComboboxDirective,
  ],
  providers: [
    { provide: NzDateAdapter, useClass: NativeDateAdapter },
    { provide: NZ_DATE_CONFIG, useValue: NZ_DATE_CONFIG_DEFAULT },
    { provide: NZ_DATE_LOCALE, useValue: 'fr-FR' },
  ],
  templateUrl: './slot-form.component.html',
  styleUrl: './slot-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotFormComponent implements OnInit {
  /** Créneau modifié ; `null` pour une création. */
  readonly slot = input<Slot | null>(null);
  /** Valeurs proposées pour une création (date, heure de début et de fin). */
  readonly defaults = input<SlotDefaults>({ date: '', startTime: '09:00', endTime: '10:00' });
  readonly submitting = input(false);
  readonly serverError = input<AppError | null>(null);

  readonly saved = output<SlotInput>();
  readonly deleted = output<void>();
  readonly cancelled = output<void>();

  private readonly fb = inject(FormBuilder).nonNullable;

  protected readonly typeOptions = SLOT_TYPE_OPTIONS;
  protected readonly recurrenceOptions = SLOT_RECURRENCE_OPTIONS;

  protected readonly form = this.fb.group(
    {
      type: this.fb.control<SlotType>('libre', [Validators.required]),
      date: this.fb.control<Date | null>(null, [Validators.required]),
      startTime: this.fb.control('', [Validators.required]),
      endTime: this.fb.control('', [Validators.required]),
      recurrence: this.fb.control<SlotRecurrence>('aucune', [Validators.required]),
    },
    { validators: endAfterStart },
  );

  private readonly recurrenceValue = toSignal(this.form.controls.recurrence.valueChanges, {
    initialValue: this.form.controls.recurrence.value,
  });
  /** Vrai si le créneau se répète : la mention de série s'affiche sous le champ. */
  protected readonly isWeekly = computed(() => this.recurrenceValue() === 'hebdomadaire');
  protected readonly isEditing = computed(() => this.slot() !== null);
  protected readonly editsSeries = computed(() => this.slot()?.recurrence === 'hebdomadaire');

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
    const slot = this.slot();
    const defaults = this.defaults();
    this.form.setValue({
      type: slot?.type ?? 'libre',
      date: isoDateToDate((slot?.date ?? defaults.date) || null),
      startTime: slot?.startTime ?? defaults.startTime,
      endTime: slot?.endTime ?? defaults.endTime,
      recurrence: slot?.recurrence ?? 'aucune',
    });
  }

  protected errorOf(field: FormFieldName): string | null {
    const serverMessage = this.serverMessages().get(field);
    if (serverMessage !== undefined) {
      return serverMessage;
    }
    const control = this.form.get(field);
    if (control?.hasError('required') && control.touched) {
      return REQUIRED_MESSAGE;
    }
    if (field === 'endTime' && this.form.hasError('endNotAfterStart') && control?.touched) {
      return END_BEFORE_START_MESSAGE;
    }
    return null;
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saved.emit({
      type: value.type,
      date: dateToIsoDate(value.date) ?? '',
      startTime: value.startTime,
      endTime: value.endTime,
      recurrence: value.recurrence,
    });
  }
}

function isFormField(field: string): field is FormFieldName {
  return Object.hasOwn(FORM_FIELDS, field);
}
