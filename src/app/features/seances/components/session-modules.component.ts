import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import {
  MODULE_TYPE_OPTIONS,
  MAX_INSTRUCTION_LENGTH,
  moduleTypeLabel,
} from '../models/session-options';
import type { EditableModule, ModuleType, TargetZones } from '../models/session.model';

interface ModuleRow {
  module: EditableModule;
  typeLabel: string;
  zones: string;
  invalid: boolean;
  first: boolean;
  last: boolean;
}

const ZONE_LABELS: Record<keyof TargetZones, string> = {
  heartRate: 'FC',
  pace: 'Allure',
  power: 'Puissance',
};

/**
 * Liste ordonnée des modules d'une séance. En lecture seule, elle affiche les modules ; en édition, elle émet
 * chaque changement (type, durée, consigne, ordre, suppression) pour que la page le porte dans le brouillon.
 * Les zones cibles et l'effort visé sont affichés, jamais modifiés ici.
 */
@Component({
  selector: 'sh-session-modules',
  imports: [NzButtonComponent, NzInputDirective],
  templateUrl: './session-modules.component.html',
  styleUrl: './session-modules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionModulesComponent {
  readonly modules = input.required<readonly EditableModule[]>();
  readonly invalidKeys = input<ReadonlySet<number>>(new Set());
  readonly readOnly = input(false);

  readonly typeChanged = output<{ key: number; type: ModuleType }>();
  readonly durationChanged = output<{ key: number; minutes: number }>();
  readonly instructionChanged = output<{ key: number; instruction: string }>();
  readonly moved = output<{ key: number; delta: -1 | 1 }>();
  readonly removed = output<number>();

  protected readonly typeOptions = MODULE_TYPE_OPTIONS;
  protected readonly maxInstructionLength = MAX_INSTRUCTION_LENGTH;

  protected readonly rows = computed<ModuleRow[]>(() => {
    const modules = this.modules();
    const invalid = this.invalidKeys();
    return modules.map((module, index) => ({
      module,
      typeLabel: moduleTypeLabel(module.type),
      zones: describeZones(module.targetZones),
      invalid: invalid.has(module.key),
      first: index === 0,
      last: index === modules.length - 1,
    }));
  });

  protected typeOf(event: Event): ModuleType {
    return (event.target as HTMLSelectElement).value as ModuleType;
  }

  protected valueOf(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}

/** Zones cibles en texte, par exemple « FC 140–160 · Allure 290–330 ». Vide si aucune zone n'est définie. */
function describeZones(zones: TargetZones | null): string {
  if (zones === null) {
    return '';
  }
  return (Object.keys(ZONE_LABELS) as (keyof TargetZones)[])
    .flatMap((key) => {
      const range = zones[key];
      return range === undefined ? [] : [`${ZONE_LABELS[key]} ${range.min}–${range.max}`];
    })
    .join(' · ');
}
