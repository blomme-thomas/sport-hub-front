import type { SlotRecurrence, SlotType } from './slot.model';

export interface SlotOption<T extends string> {
  value: T;
  label: string;
}

export const SLOT_TYPE_OPTIONS: readonly SlotOption<SlotType>[] = [
  { value: 'libre', label: 'Libre' },
  { value: 'occupe', label: 'Occupé' },
];

export const SLOT_RECURRENCE_OPTIONS: readonly SlotOption<SlotRecurrence>[] = [
  { value: 'aucune', label: 'Aucune (ponctuel)' },
  { value: 'hebdomadaire', label: 'Chaque semaine' },
];

export function slotTypeLabel(type: SlotType): string {
  return SLOT_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
