import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { isPlanModuleValid } from '../../plan-seances/plan-seances.parser';
import {
  PLAN_MODULE_LABELS,
  PLAN_MODULE_TYPES,
  type PlanModuleType,
  type PlanSeanceModule,
} from '../../plan-seances/plan-seances.model';

const TEXT_MAX_LENGTH = 2000;
const DURATION_MIN = 1;
const DURATION_MAX = 1440;

/**
 * Liste éditable des modules d'un fichier `plan-seances` : type, durée, consigne, suppression. Chaque modification
 * émet la liste complète ; la validation (`isPlanModuleValid`) reste au parent, qui décide de l'enregistrement.
 */
@Component({
  selector: 'sh-plan-modules-editor',
  imports: [NzButtonComponent],
  templateUrl: './plan-modules-editor.component.html',
  styleUrl: './plan-modules-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanModulesEditorComponent {
  readonly modules = input.required<readonly PlanSeanceModule[]>();

  readonly modulesChange = output<PlanSeanceModule[]>();

  protected readonly typeOptions = PLAN_MODULE_TYPES.map((value) => ({
    value,
    label: PLAN_MODULE_LABELS[value],
  }));
  protected readonly durationMin = DURATION_MIN;
  protected readonly durationMax = DURATION_MAX;
  protected readonly instructionMax = TEXT_MAX_LENGTH;
  protected readonly totalMinutes = computed(() =>
    this.modules().reduce((sum, module) => sum + module.durationMinutes, 0),
  );

  protected isValid(module: PlanSeanceModule): boolean {
    return isPlanModuleValid(module);
  }

  protected typeChanged(index: number, value: string): void {
    this.update(index, { type: value as PlanModuleType });
  }

  protected durationChanged(index: number, value: string): void {
    this.update(index, { durationMinutes: Number(value) });
  }

  protected instructionChanged(index: number, value: string): void {
    this.update(index, { instruction: value });
  }

  protected remove(index: number): void {
    this.modulesChange.emit(this.modules().filter((_, position) => position !== index));
  }

  private update(index: number, changes: Partial<PlanSeanceModule>): void {
    this.modulesChange.emit(
      this.modules().map((module, position) =>
        position === index ? { ...module, ...changes } : module,
      ),
    );
  }
}
