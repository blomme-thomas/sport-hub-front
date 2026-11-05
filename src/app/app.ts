import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ShellComponent } from './core/layout/shell.component';

@Component({
  selector: 'sh-root',
  imports: [ShellComponent],
  template: '<sh-shell />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
