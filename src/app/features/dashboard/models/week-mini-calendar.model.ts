import type { DisciplineStyle } from '../../../shared/ui/discipline/discipline-style';
import { TEXTS } from '@shared/texts/texts';

/** Séance planifiée affichée dans le mini-calendrier. `startTime` est toujours renseignée (`HH:mm`). */
export interface WeekMiniSession {
  id: string;
  date: string;
  startTime: string;
  disciplineTypeKey: string;
  /** Libellé du référentiel pour le type de la séance, renseigné par l'état. */
  disciplineLabel?: string;
}

/** Discipline du référentiel : libellé et famille de sport (course, vélo, natation, autre). */
export interface WeekMiniDiscipline {
  label: string;
  family: string;
}

/** Libellés des familles affichés dans la légende. */
export const FAMILY_LABELS: Readonly<Record<string, string>> = {
  running: TEXTS.dashboard.sports.running,
  cycling: TEXTS.dashboard.families.cycling,
  swimming: TEXTS.dashboard.families.swimming,
  other: TEXTS.dashboard.sports.other,
};

/** Activité réalisée affichée dans le mini-calendrier, en lecture seule. */
export interface WeekMiniActivity {
  id: string;
  /** Libellé accessible : « Course à pied, 45 min ». */
  label: string;
  /** Heure de début, locale, au format `HH:mm`. */
  startTime: string;
  discipline: DisciplineStyle;
}

/** Libellé d'une discipline présente sur la semaine, pour la légende. */
export interface WeekMiniLegendEntry {
  typeKey: string;
  label: string;
}
