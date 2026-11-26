import { fill, TEXTS } from '@shared/texts/texts';
import type { PlanImportKind } from '../models/plan-import.model';

export type PlanImportCount =
  { ok: true; count: number; content: unknown } | { ok: false; message: string };

/**
 * Compte les éléments d'un fichier `plan-aliments` ou `plan-recettes` sans les valider : la validation est faite
 * par le back, qui refuse le fichier entier en cas d'erreur. Accepte l'enveloppe `{ kind, schemaVersion, <liste> }`
 * et un tableau brut. Le contenu renvoyé est le JSON tel quel, à envoyer sans modification.
 */
export function countPlanItems(text: string, kind: PlanImportKind): PlanImportCount {
  let content: unknown;
  try {
    content = JSON.parse(text);
  } catch {
    return { ok: false, message: TEXTS.nutrition.planImport.malformed };
  }

  const list = Array.isArray(content) ? content : isRecord(content) ? content[kind] : undefined;
  if (!Array.isArray(list)) {
    return { ok: false, message: fill(TEXTS.nutrition.planImport.noList, { list: kind }) };
  }
  if (list.length === 0) {
    return { ok: false, message: TEXTS.nutrition.planImport.empty };
  }
  return { ok: true, count: list.length, content };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
