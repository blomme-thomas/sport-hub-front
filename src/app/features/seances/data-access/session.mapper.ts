import type {
  ReplaceSessionModulesRequestApi,
  SessionApi,
  SessionModuleApi,
  SessionModuleRequestApi,
} from '../models/session.api-model';
import type { EditableModule, Session, SessionModule } from '../models/session.model';

/** Valeur ajoutée à un module nouvellement créé dans le brouillon. */
export const NEW_MODULE_DEFAULTS = {
  type: 'series',
  durationMinutes: 10,
  instruction: '',
} as const;

/**
 * Séance de l'API en modèle UI. `labelOf` traduit la clé de discipline ; une clé inconnue reste telle quelle.
 */
export function toSession(api: SessionApi, labelOf: (typeKey: string) => string): Session {
  return {
    id: api.id,
    date: api.date,
    disciplineLabel: labelOf(api.disciplineTypeKey),
    durationMinutes: api.durationMinutes,
    startTime: api.startTime,
    status: api.status,
    modifiedManually: api.modifiedManually,
    description: api.description,
    equipment: api.equipment,
    attentionPoints: api.attentionPoints,
    modules: api.modules.map(toSessionModule),
  };
}

export function toSessionModule(api: SessionModuleApi): SessionModule {
  return {
    position: api.position,
    type: api.type,
    durationMinutes: api.durationMinutes,
    instruction: api.instruction,
    targetZones: api.targetZones,
    perceivedEffort: api.perceivedEffort,
  };
}

/** Copie les modules dans le brouillon ; `nextKey` fournit les clés locales. */
export function toEditable(
  modules: readonly SessionModule[],
  nextKey: () => number,
): EditableModule[] {
  return modules.map((module) => ({
    key: nextKey(),
    type: module.type,
    durationMinutes: module.durationMinutes,
    instruction: module.instruction,
    targetZones: module.targetZones,
    perceivedEffort: module.perceivedEffort,
  }));
}

/** Corps de `PUT /api/sessions/:id/modules` : l'ordre du brouillon donne les positions. */
export function toReplaceRequest(
  modules: readonly EditableModule[],
): ReplaceSessionModulesRequestApi {
  return {
    modules: modules.map((module): SessionModuleRequestApi => ({
      type: module.type,
      durationMinutes: module.durationMinutes,
      instruction: module.instruction.trim(),
      targetZones: module.targetZones,
      perceivedEffort: module.perceivedEffort,
    })),
  };
}

/** Vrai si le brouillon diffère de l'état enregistré (contenu ou ordre). */
export function isDirty(
  draft: readonly EditableModule[],
  saved: readonly SessionModule[],
): boolean {
  if (draft.length !== saved.length) {
    return true;
  }
  return draft.some((module, index) => {
    const original = saved[index];
    return (
      original === undefined ||
      module.type !== original.type ||
      module.durationMinutes !== original.durationMinutes ||
      module.instruction.trim() !== original.instruction
    );
  });
}
