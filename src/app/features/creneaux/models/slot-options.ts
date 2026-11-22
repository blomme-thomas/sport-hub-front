import type { SlotRecurrence, SlotType } from './slot.model';
import { TEXTS } from '@shared/texts/texts';

export interface SlotOption<T extends string> {
  value: T;
  label: string;
}

export const SLOT_TYPE_OPTIONS: readonly SlotOption<SlotType>[] = [
  { value: 'libre', label: TEXTS.creneaux.slot.free },
  { value: 'occupe', label: TEXTS.creneaux.slot.busy },
];

export const SLOT_RECURRENCE_OPTIONS: readonly SlotOption<SlotRecurrence>[] = [
  { value: 'aucune', label: TEXTS.creneaux.slot.none },
  { value: 'hebdomadaire', label: TEXTS.creneaux.slot.weekly },
];

export function slotTypeLabel(type: SlotType): string {
  return SLOT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
