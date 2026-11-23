import {
  PLAN_MODULE_TYPES,
  PLAN_SEANCES_KIND,
  PLAN_SEANCES_NUTRITION_VERSION,
  PLAN_SEANCES_SUPPORTED_VERSIONS,
  type PlanSeance,
  type PlanSeanceIssue,
  type PlanSeanceModule,
  type PlanTargetZones,
} from './plan-seances.model';
import { fill, TEXTS } from '@shared/texts/texts';
import { SESSION_CARBS_UNITS, type SessionCarbsUnit } from '../nutrition/session-nutrition';

/** Bornes identiques au back : durée 1 à 1440, 30 modules au plus, consignes de 2000 caractères au plus. */
const DURATION_MAX = 1440;
const TITLE_MAX = 200;
const MODULES_MAX = 30;
const TEXT_MAX = 2000;
const DISCIPLINE_KEY_MAX = 100;
const EFFORT_MAX = 10;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const ZONE_KEYS = ['heartRate', 'pace', 'power'] as const;

const SEANCE_FIELDS = [
  'date',
  'disciplineTypeKey',
  'durationMinutes',
  'startTime',
  'title',
  'description',
  'targetDistanceMeters',
  'targetHrZonePercentages',
  'modules',
];
/** Champs ajoutés en version 2 : refusés dans une version 1. */
const NUTRITION_FIELDS = ['carbsGrams', 'carbsUnit', 'hydrationMilliliters'];
const CARBS_GRAMS_MAX = 1000;
const HYDRATION_MILLILITERS_MAX = 20000;
const MODULE_FIELDS = ['type', 'durationMinutes', 'instruction', 'targetZones', 'perceivedEffort'];

export type PlanParseResult =
  { ok: true; seance: PlanSeance } | { ok: false; issues: PlanSeanceIssue[] };

export type PlanCountResult =
  { ok: true; count: number; content: Record<string, unknown> } | { ok: false; message: string };

/** Valeurs à reporter dans le formulaire : seuls les champs présents dans le fichier y figurent. */
export interface SessionPrefill {
  date: string;
  durationMinutes: number;
  disciplineTypeKey: string;
  startTime?: string;
  title?: string;
  description?: string;
  /** Distance cible en mètres, reprise telle quelle du fichier. */
  targetDistanceMeters?: number;
  /** Répartition Z1 à Z5, totalisant 100. */
  targetHrZonePercentages?: number[];
  carbsGrams?: number | null;
  carbsUnit?: SessionCarbsUnit | null;
  hydrationMilliliters?: number | null;
  modules: PlanSeanceModule[];
}

type Fields = Record<string, unknown>;

/**
 * Lit un fichier `plan-seances` qui ne doit contenir qu'une séance, et valide chaque champ avec son chemin JSON.
 * `knownDisciplineKeys`, s'il est fourni, sert à signaler une discipline absente du référentiel.
 */
export function parseSingleSession(
  text: string,
  knownDisciplineKeys?: ReadonlySet<string>,
): PlanParseResult {
  const parsed = parseJson(text);
  if (!parsed.ok) {
    return { ok: false, issues: [{ path: 'racine', message: parsed.message }] };
  }
  const root = parsed.value;
  if (!isRecord(root)) {
    return {
      ok: false,
      issues: [{ path: 'racine', message: 'le fichier doit contenir un objet JSON' }],
    };
  }

  const issues: PlanSeanceIssue[] = [];
  if (root['kind'] !== PLAN_SEANCES_KIND) {
    issues.push({
      path: 'kind',
      message: fill(TEXTS.shared.planSeances.mustBe, { value: PLAN_SEANCES_KIND }),
    });
  }
  const version = root['schemaVersion'];
  if (typeof version !== 'number' || !PLAN_SEANCES_SUPPORTED_VERSIONS.includes(version)) {
    issues.push({
      path: 'schemaVersion',
      message: fill(TEXTS.shared.planSeances.mustBe, {
        value: PLAN_SEANCES_SUPPORTED_VERSIONS.join(' ou '),
      }),
    });
  }
  const seances = root['seances'];
  if (!Array.isArray(seances) || seances.length === 0) {
    issues.push({ path: 'seances', message: TEXTS.shared.planSeances.seancesExpected });
  } else if (seances.length > 1) {
    issues.push({
      path: 'seances',
      message: fill(TEXTS.shared.planSeances.severalSeances, { count: seances.length }),
    });
  }
  if (issues.length > 0 || !Array.isArray(seances)) {
    return { ok: false, issues };
  }

  const schemaVersion = typeof version === 'number' ? version : PLAN_SEANCES_NUTRITION_VERSION - 1;
  const seance = validateSeance(
    seances[0],
    'seances[0]',
    knownDisciplineKeys,
    issues,
    schemaVersion,
  );
  if (seance === null || issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, seance };
}

/**
 * Compte les séances d'un fichier sans valider leur contenu : la validation est faite par le back à l'import.
 * Renvoie aussi le contenu JSON, à envoyer tel quel.
 */
export function countSessions(text: string): PlanCountResult {
  const parsed = parseJson(text);
  if (!parsed.ok) {
    return { ok: false, message: parsed.message };
  }
  const root = parsed.value;
  if (!isRecord(root) || !Array.isArray(root['seances'])) {
    return { ok: false, message: TEXTS.shared.planSeances.noSeancesList };
  }
  const count = root['seances'].length;
  if (count === 0) {
    return { ok: false, message: TEXTS.shared.planSeances.noSeance };
  }
  return { ok: true, count, content: root };
}

/** Valeurs à reporter dans un formulaire. Un champ absent ou `null` du fichier n'est pas repris. */
export function toPrefill(seance: PlanSeance): SessionPrefill {
  const prefill: SessionPrefill = {
    date: seance.date,
    durationMinutes: seance.durationMinutes,
    disciplineTypeKey: seance.disciplineTypeKey,
    modules: seance.modules.map((module) => ({
      type: module.type,
      durationMinutes: module.durationMinutes,
      instruction: module.instruction,
      targetZones: module.targetZones ?? null,
      perceivedEffort: module.perceivedEffort ?? null,
    })),
  };
  if (seance.startTime) {
    prefill.startTime = seance.startTime;
  }
  if (seance.description !== undefined && seance.description !== null) {
    prefill.description = seance.description;
  }
  if (seance.title) {
    prefill.title = seance.title;
  }
  if (seance.targetDistanceMeters !== undefined && seance.targetDistanceMeters !== null) {
    prefill.targetDistanceMeters = seance.targetDistanceMeters;
  }
  if (seance.targetHrZonePercentages) {
    prefill.targetHrZonePercentages = seance.targetHrZonePercentages;
  }
  // Version 2 : les champs de nutrition sont repris, `null` compris, dès qu'ils figurent dans le fichier.
  if (seance.carbsGrams !== undefined) {
    prefill.carbsGrams = seance.carbsGrams;
    prefill.carbsUnit = seance.carbsUnit ?? null;
  }
  if (seance.hydrationMilliliters !== undefined) {
    prefill.hydrationMilliliters = seance.hydrationMilliliters;
  }
  return prefill;
}

function parseJson(text: string): { ok: true; value: unknown } | { ok: false; message: string } {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const reason =
      error instanceof SyntaxError ? error.message : TEXTS.shared.planSeances.readError;
    return { ok: false, message: fill(TEXTS.shared.planSeances.malformed, { reason }) };
  }
}

function validateSeance(
  raw: unknown,
  path: string,
  knownKeys: ReadonlySet<string> | undefined,
  issues: PlanSeanceIssue[],
  schemaVersion: number,
): PlanSeance | null {
  if (!isRecord(raw)) {
    issues.push({ path, message: TEXTS.shared.planSeances.seanceNotObject });
    return null;
  }
  const before = issues.length;
  const nutritionAllowed = schemaVersion >= PLAN_SEANCES_NUTRITION_VERSION;
  rejectUnknownFields(
    raw,
    nutritionAllowed ? [...SEANCE_FIELDS, ...NUTRITION_FIELDS] : SEANCE_FIELDS,
    path,
    issues,
  );

  const date = readDate(raw, 'date', path, issues);
  const disciplineTypeKey = readText(raw, 'disciplineTypeKey', path, issues, {
    required: true,
    max: DISCIPLINE_KEY_MAX,
  });
  if (disciplineTypeKey !== null && knownKeys !== undefined && !knownKeys.has(disciplineTypeKey)) {
    issues.push({
      path: `${path}.disciplineTypeKey`,
      message: TEXTS.shared.planSeances.unknownDiscipline,
    });
  }
  const durationMinutes = readInteger(raw, 'durationMinutes', path, issues, {
    required: true,
    min: 1,
    max: DURATION_MAX,
  });
  const startTime = readStartTime(raw, path, issues);
  const title = readText(raw, 'title', path, issues, { required: false, max: TITLE_MAX });
  const description = readText(raw, 'description', path, issues, {
    required: false,
    max: TEXT_MAX,
  });
  const targetDistanceMeters = readInteger(raw, 'targetDistanceMeters', path, issues, {
    required: false,
    min: 1,
  });
  const targetHrZonePercentages = readZonePercentages(raw, path, issues);
  const nutrition = nutritionAllowed ? readNutrition(raw, path, issues) : null;

  const modules = validateModules(raw['modules'], `${path}.modules`, issues);

  if (
    issues.length > before ||
    date === null ||
    disciplineTypeKey === null ||
    durationMinutes === null
  ) {
    return null;
  }
  return {
    date,
    disciplineTypeKey,
    durationMinutes,
    startTime,
    title,
    description,
    targetDistanceMeters,
    targetHrZonePercentages,
    ...(nutrition ?? {}),
    modules,
  };
}

/** Glucides (1 à 1000 g), leur unité, et hydratation (1 à 20000 ml) : tous facultatifs, les glucides vont avec leur unité. */
function readNutrition(
  raw: Fields,
  path: string,
  issues: PlanSeanceIssue[],
): {
  carbsGrams: number | null;
  carbsUnit: SessionCarbsUnit | null;
  hydrationMilliliters: number | null;
} {
  const carbsGrams = readInteger(raw, 'carbsGrams', path, issues, {
    required: false,
    min: 1,
    max: CARBS_GRAMS_MAX,
  });
  const carbsUnit = readOptionalEnum(raw, 'carbsUnit', path, issues, SESSION_CARBS_UNITS);
  const hydrationMilliliters = readInteger(raw, 'hydrationMilliliters', path, issues, {
    required: false,
    min: 1,
    max: HYDRATION_MILLILITERS_MAX,
  });
  const hasGrams = raw['carbsGrams'] !== undefined && raw['carbsGrams'] !== null;
  const hasUnit = raw['carbsUnit'] !== undefined && raw['carbsUnit'] !== null;
  if (hasGrams !== hasUnit) {
    issues.push({ path: `${path}.carbsUnit`, message: TEXTS.shared.planSeances.carbsPair });
  }
  return { carbsGrams, carbsUnit, hydrationMilliliters };
}

function readOptionalEnum<T extends string>(
  raw: Fields,
  key: string,
  path: string,
  issues: PlanSeanceIssue[],
  values: readonly T[],
): T | null {
  const value = raw[key];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string' || !(values as readonly string[]).includes(value)) {
    issues.push({
      path: `${path}.${key}`,
      message: fill(TEXTS.shared.planSeances.oneOf, { values: values.join(', ') }),
    });
    return null;
  }
  return value as T;
}

function validateModules(
  raw: unknown,
  path: string,
  issues: PlanSeanceIssue[],
): PlanSeanceModule[] {
  if (raw === undefined || raw === null) {
    issues.push({ path, message: TEXTS.shared.planSeances.required });
    return [];
  }
  if (!Array.isArray(raw)) {
    issues.push({ path, message: TEXTS.shared.planSeances.mustBeList });
    return [];
  }
  if (raw.length === 0 || raw.length > MODULES_MAX) {
    issues.push({
      path,
      message: fill(TEXTS.shared.planSeances.modulesCount, { max: MODULES_MAX }),
    });
    return [];
  }
  const modules: PlanSeanceModule[] = [];
  raw.forEach((item, index) => {
    const module = validateModule(item, `${path}[${index}]`, issues);
    if (module !== null) {
      modules.push(module);
    }
  });
  return modules;
}

function validateModule(
  raw: unknown,
  path: string,
  issues: PlanSeanceIssue[],
): PlanSeanceModule | null {
  if (!isRecord(raw)) {
    issues.push({ path, message: TEXTS.shared.planSeances.moduleNotObject });
    return null;
  }
  const before = issues.length;
  rejectUnknownFields(raw, MODULE_FIELDS, path, issues);

  const type = readEnum(raw, 'type', path, issues, PLAN_MODULE_TYPES);
  const durationMinutes = readInteger(raw, 'durationMinutes', path, issues, {
    required: true,
    min: 1,
    max: DURATION_MAX,
  });
  const instruction = readText(raw, 'instruction', path, issues, {
    required: true,
    max: TEXT_MAX,
    notBlank: true,
  });
  const targetZones = readTargetZones(raw['targetZones'], `${path}.targetZones`, issues);
  const perceivedEffort = readOptionalInteger(raw, 'perceivedEffort', path, issues, EFFORT_MAX);

  if (issues.length > before || type === null || durationMinutes === null || instruction === null) {
    return null;
  }
  return { type, durationMinutes, instruction, targetZones, perceivedEffort };
}

function readTargetZones(
  raw: unknown,
  path: string,
  issues: PlanSeanceIssue[],
): PlanTargetZones | null {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (!isRecord(raw)) {
    issues.push({ path, message: TEXTS.shared.planSeances.mustBeObject });
    return null;
  }
  rejectUnknownFields(raw, [...ZONE_KEYS], path, issues);
  const zones: PlanTargetZones = {};
  for (const key of ZONE_KEYS) {
    const value = raw[key];
    if (value === undefined || value === null) {
      continue;
    }
    const zonePath = `${path}.${key}`;
    if (!isRecord(value)) {
      issues.push({ path: zonePath, message: TEXTS.shared.planSeances.zoneObject });
      continue;
    }
    const min = readInteger(value, 'min', zonePath, issues, { required: true, min: 1 });
    const max = readInteger(value, 'max', zonePath, issues, { required: true, min: 1 });
    if (min !== null && max !== null) {
      zones[key] = { min, max };
    }
  }
  return zones;
}

function readStartTime(raw: Fields, path: string, issues: PlanSeanceIssue[]): string | null {
  const value = raw['startTime'];
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    issues.push({ path: `${path}.startTime`, message: TEXTS.shared.planSeances.startTimeFormat });
    return null;
  }
  return value;
}

function readDate(
  raw: Fields,
  key: string,
  path: string,
  issues: PlanSeanceIssue[],
): string | null {
  const value = readText(raw, key, path, issues, { required: true });
  if (value === null) {
    return null;
  }
  if (!DATE_PATTERN.test(value) || !isCalendarDate(value)) {
    issues.push({ path: `${path}.${key}`, message: TEXTS.shared.planSeances.dateFormat });
    return null;
  }
  return value;
}

interface TextRule {
  required?: boolean;
  max?: number;
  notBlank?: boolean;
}

function readText(
  raw: Fields,
  key: string,
  path: string,
  issues: PlanSeanceIssue[],
  rule: TextRule,
): string | null {
  const value = raw[key];
  const fieldPath = `${path}.${key}`;
  if (value === undefined || value === null) {
    if (rule.required) {
      issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.required });
    }
    return null;
  }
  if (typeof value !== 'string') {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.mustBeString });
    return null;
  }
  if (rule.notBlank && value.trim() === '') {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.empty });
    return null;
  }
  if (rule.max !== undefined && value.length > rule.max) {
    issues.push({
      path: fieldPath,
      message: fill(TEXTS.shared.planSeances.maxLength, { max: rule.max }),
    });
    return null;
  }
  return value;
}

interface IntegerRule {
  required: boolean;
  min: number;
  max?: number;
}

function readInteger(
  raw: Fields,
  key: string,
  path: string,
  issues: PlanSeanceIssue[],
  rule: IntegerRule,
): number | null {
  const value = raw[key];
  const fieldPath = `${path}.${key}`;
  if (value === undefined || value === null) {
    if (rule.required) {
      issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.required });
    }
    return null;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.mustBeInteger });
    return null;
  }
  if (value < rule.min || (rule.max !== undefined && value > rule.max)) {
    const bounds =
      rule.max === undefined
        ? fill(TEXTS.shared.planSeances.bounds.min, { min: rule.min })
        : fill(TEXTS.shared.planSeances.bounds.range, { min: rule.min, max: rule.max });
    issues.push({
      path: fieldPath,
      message: fill(TEXTS.shared.planSeances.mustBe, { value: bounds }),
    });
    return null;
  }
  return value;
}

function readOptionalInteger(
  raw: Fields,
  key: string,
  path: string,
  issues: PlanSeanceIssue[],
  max: number,
): number | null {
  return readInteger(raw, key, path, issues, { required: false, min: 1, max });
}

function readEnum<T extends string>(
  raw: Fields,
  key: string,
  path: string,
  issues: PlanSeanceIssue[],
  values: readonly T[],
): T | null {
  const value = raw[key];
  const fieldPath = `${path}.${key}`;
  if (value === undefined || value === null) {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.required });
    return null;
  }
  if (typeof value !== 'string' || !(values as readonly string[]).includes(value)) {
    issues.push({
      path: fieldPath,
      message: fill(TEXTS.shared.planSeances.oneOf, { values: values.join(', ') }),
    });
    return null;
  }
  return value as T;
}

function rejectUnknownFields(
  raw: Fields,
  allowed: readonly string[],
  path: string,
  issues: PlanSeanceIssue[],
): void {
  for (const key of Object.keys(raw)) {
    if (!allowed.includes(key)) {
      issues.push({ path: `${path}.${key}`, message: TEXTS.shared.planSeances.unknownField });
    }
  }
}

/** Vrai pour une date AAAA-MM-JJ qui existe (ni 2026-02-30 ni 2026-13-01). */
function isCalendarDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isRecord(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Vrai si un module respecte les bornes du format (durée 1 à 1440, consigne non vide de 2000 caractères au plus). */
export function isPlanModuleValid(module: PlanSeanceModule): boolean {
  return (
    Number.isInteger(module.durationMinutes) &&
    module.durationMinutes >= 1 &&
    module.durationMinutes <= DURATION_MAX &&
    module.instruction.trim() !== '' &&
    module.instruction.length <= TEXT_MAX
  );
}

/** Répartition Z1 à Z5 : 5 entiers de 0 à 100 ; absente ou \`null\` si non renseignée. Le total (100) est contrôlé ici. */
function readZonePercentages(
  raw: Fields,
  path: string,
  issues: PlanSeanceIssue[],
): number[] | null {
  const value = raw['targetHrZonePercentages'];
  const fieldPath = `${path}.targetHrZonePercentages`;
  if (value === undefined || value === null) {
    return null;
  }
  if (
    !Array.isArray(value) ||
    value.length !== 5 ||
    !value.every((item) => Number.isInteger(item))
  ) {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.zonesList });
    return null;
  }
  const numbers = value as number[];
  if (numbers.some((item) => item < 0 || item > 100)) {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.zoneRange });
    return null;
  }
  if (numbers.reduce((sum, item) => sum + item, 0) !== 100) {
    issues.push({ path: fieldPath, message: TEXTS.shared.planSeances.zonesTotal });
    return null;
  }
  return numbers;
}
