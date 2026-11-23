import { TEXTS } from '@shared/texts/texts';
import type { SessionCarbsUnit } from '../nutrition/session-nutrition';
/** Format de fichier `plan-seances` (forme JSON, identique au modèle renvoyé par le back). */
export const PLAN_SEANCES_KIND = 'plan-seances';
/** Version écrite par le back ; la version 1 reste acceptée (sans champs de nutrition). */
export const PLAN_SEANCES_SCHEMA_VERSION = 2;
export const PLAN_SEANCES_SUPPORTED_VERSIONS: readonly number[] = [1, 2];
/** Première version qui porte glucides et hydratation. */
export const PLAN_SEANCES_NUTRITION_VERSION = 2;

export const PLAN_MODULE_TYPES = [
  'echauffement',
  'educatifs',
  'series',
  'retour_au_calme',
  'autre',
] as const;

export type PlanModuleType = (typeof PLAN_MODULE_TYPES)[number];

export interface PlanZoneRange {
  min: number;
  max: number;
}

/** Zones cibles d'un module ; une zone absente n'est pas définie. */
export interface PlanTargetZones {
  heartRate?: PlanZoneRange;
  pace?: PlanZoneRange;
  power?: PlanZoneRange;
}

export interface PlanSeanceModule {
  type: PlanModuleType;
  durationMinutes: number;
  instruction: string;
  targetZones: PlanTargetZones | null;
  perceivedEffort: number | null;
}

/** Une séance du fichier. `startTime` et `description` peuvent être absents ou `null`. */
export interface PlanSeance {
  date: string;
  disciplineTypeKey: string;
  durationMinutes: number;
  startTime?: string | null;
  /** Titre de la séance, 200 caractères au plus. */
  title?: string | null;
  description?: string | null;
  /** Distance cible en mètres. */
  targetDistanceMeters?: number | null;
  /** Répartition cible par zone de FC, Z1 à Z5, totalisant 100. */
  targetHrZonePercentages?: number[] | null;
  /** Nutrition (version 2) : glucides en grammes avec leur unité, hydratation en millilitres. */
  carbsGrams?: number | null;
  carbsUnit?: SessionCarbsUnit | null;
  hydrationMilliliters?: number | null;
  modules: PlanSeanceModule[];
}

/** Erreur de validation : `path` est le chemin JSON, par exemple `seances[0].modules[1].durationMinutes`. */
export interface PlanSeanceIssue {
  path: string;
  message: string;
}

export const PLAN_MODULE_LABELS: Readonly<Record<PlanModuleType, string>> =
  TEXTS.shared.moduleTypes;
