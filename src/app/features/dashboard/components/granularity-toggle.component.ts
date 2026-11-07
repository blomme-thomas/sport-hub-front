import { ChangeDetectionStrategy, Component, OnChanges, input, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NzRadioComponent, NzRadioGroupComponent } from 'ng-zorro-antd/radio';
import type { Granularity } from '../models/training-stats.model';

@Component({
  selector: 'sh-granularity-toggle',
  imports: [ReactiveFormsModule, NzRadioGroupComponent, NzRadioComponent],
  templateUrl: './granularity-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GranularityToggleComponent implements OnChanges {
  readonly value = input.required<Granularity>();
  readonly changed = output<Granularity>();

  protected readonly control = new FormControl<Granularity>('week', { nonNullable: true });

  constructor() {
    this.control.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((granularity) => this.changed.emit(granularity));
  }

  ngOnChanges(): void {
    this.control.setValue(this.value(), { emitEvent: false });
  }
}
