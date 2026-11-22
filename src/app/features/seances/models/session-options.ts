import type { ModuleType } from './session.model';

export const MODULE_TYPE_OPTIONS: readonly { value: ModuleType; label: string }[] = [
  { value: 'echauffement', label: TEXTS.shared.moduleTypes.echauffement },
  { value: 'educatifs', label: TEXTS.shared.moduleTypes.educatifs },
  { value: 'series', label: TEXTS.shared.moduleTypes.series },
  { value: 'retour_au_calme', label: TEXTS.shared.moduleTypes.retour_au_calme },
  { value: 'autre', label: TEXTS.shared.moduleTypes.autre },
];

export const MAX_MODULES = 30;
export const MAX_INSTRUCTION_LENGTH = 2000;
export {
  MIN_SESSION_DURATION_MINUTES as MIN_DURATION_MINUTES,
  MAX_SESSION_DURATION_MINUTES as MAX_DURATION_MINUTES,
} from '../../../shared/utils/session-limits';
import { TEXTS } from '@shared/texts/texts';

export function moduleTypeLabel(type: ModuleType): string {
  return MODULE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type;
}
