import type { ModuleType } from './session.model';

export const MODULE_TYPE_OPTIONS: readonly { value: ModuleType; label: string }[] = [
  { value: 'echauffement', label: 'Échauffement' },
  { value: 'educatifs', label: 'Éducatifs' },
  { value: 'series', label: 'Séries' },
  { value: 'retour_au_calme', label: 'Retour au calme' },
  { value: 'autre', label: 'Autre' },
];

export const MAX_MODULES = 30;
export const MAX_INSTRUCTION_LENGTH = 2000;
export const MAX_PERCEIVED_EFFORT = 10;
export {
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
} from '../../../shared/utils/session-limits';

export function moduleTypeLabel(type: ModuleType): string {
  return MODULE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
