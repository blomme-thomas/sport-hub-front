// Squelette — à copier dans features/<feature>/components/<name>-form.component.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/06-forms.instructions.md

import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

export interface ExampleFormValue {
  title: string;
  durationMin: number;
}

@Component({
  selector: 'sh-example-form',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()">
      <label for="title">Titre</label>
      <input id="title" formControlName="title" [attr.aria-describedby]="titleInvalid ? 'title-error' : null" />
      @if (titleInvalid) {
        <p id="title-error" role="alert">Le titre est obligatoire.</p>
      }

      <label for="duration">Durée (min)</label>
      <input id="duration" type="number" formControlName="durationMin" />

      <button type="submit" [disabled]="submitting()">Enregistrer</button>
    </form>
  `,
})
export class ExampleFormComponent {
  private readonly fb = inject(FormBuilder).nonNullable;

  readonly submitting = input(false);
  readonly saved = output<ExampleFormValue>();

  protected readonly form = this.fb.group({
    title: ['', [Validators.required]],
    durationMin: [30, [Validators.required, Validators.min(1)]],
  });

  protected get titleInvalid(): boolean {
    const c = this.form.controls.title;
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saved.emit(this.form.getRawValue()); // valeur typée ; le mapping vers le DTO API se fait en data-access
  }
}
