import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzInputDirective } from 'ng-zorro-antd/input';
import {
  MODULE_TYPE_OPTIONS,
  MAX_INSTRUCTION_LENGTH,
  moduleTypeLabel,
} from '../../models/session-options';
import type { EditableModule, ModuleType, TargetZones } from '../../models/session.model';
import { fill, TEXTS } from '@shared/texts/texts';

interface ModuleRow {
  module: EditableModule;
  typeLabel: string;
  zones: string;
  invalid: boolean;
}

const ZONE_LABELS: Record<keyof TargetZones, string> = {
  heartRate: TEXTS.seances.modules.zoneLabels.heartRate,
  pace: TEXTS.seances.modules.zoneLabels.pace,
  power: TEXTS.seances.modules.zoneLabels.power,
};

/**
 * Liste ordonnée des modules d'une séance. En lecture seule, elle affiche les modules ; en édition, elle émet
 * chaque changement (type, durée, consigne, ordre, suppression) pour que la page le porte dans le brouillon.
 * Les zones cibles et l'effort visé sont affichés, jamais modifiés ici.
 */
@Component({
  selector: 'sh-session-modules',
  imports: [IconComponent, NzButtonComponent, NzInputDirective],
  templateUrl: './session-modules.component.html',
  styleUrl: './session-modules.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionModulesComponent {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly modules = input.required<readonly EditableModule[]>();
  readonly invalidKeys = input<ReadonlySet<number>>(new Set());
  readonly readOnly = input(false);

  readonly typeChanged = output<{ key: number; type: ModuleType }>();
  readonly durationChanged = output<{ key: number; minutes: number }>();
  readonly instructionChanged = output<{ key: number; instruction: string }>();
  /** Module déposé à la position `toIndex` (0 = premier), après un glisser-déposer. */
  readonly reordered = output<{ key: number; toIndex: number }>();
  readonly removed = output<number>();

  protected readonly typeOptions = MODULE_TYPE_OPTIONS;
  protected readonly maxInstructionLength = MAX_INSTRUCTION_LENGTH;

  /** Module dont la poignée est enfoncée : seul lui peut être glissé, pour laisser les champs utilisables. */
  protected readonly armedKey = signal<number | null>(null);
  /** Module en cours de glissement. */
  protected readonly draggedKey = signal<number | null>(null);
  /** Module survolé pendant le glissement, où le module glissé sera déposé. */
  protected readonly overKey = signal<number | null>(null);

  protected readonly rows = computed<ModuleRow[]>(() => {
    const modules = this.modules();
    const invalid = this.invalidKeys();
    return modules.map((module) => ({
      module,
      typeLabel: moduleTypeLabel(module.type),
      zones: describeZones(module.targetZones),
      invalid: invalid.has(module.key),
    }));
  });

  protected arm(key: number): void {
    this.armedKey.set(key);
  }

  protected disarm(): void {
    this.armedKey.set(null);
  }

  protected dragStart(event: DragEvent, key: number): void {
    if (this.armedKey() !== key) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', String(key));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    this.draggedKey.set(key);
  }

  protected dragOver(event: DragEvent, key: number): void {
    if (this.draggedKey() === null) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.overKey.set(key);
  }

  protected drop(event: DragEvent, toIndex: number): void {
    const key = this.draggedKey();
    event.preventDefault();
    this.endDrag();
    if (key !== null) {
      this.reordered.emit({ key, toIndex });
    }
  }

  protected endDrag(): void {
    this.armedKey.set(null);
    this.draggedKey.set(null);
    this.overKey.set(null);
  }

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
