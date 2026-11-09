import type { IconName } from '../icon/icon.component';

/** Pictogramme et couleur d'une discipline. Une clé absente de la correspondance reçoit le style neutre. */
export interface DisciplineStyle {
  icon: IconName;
  color: string;
}

const NEUTRAL: DisciplineStyle = { icon: 'list', color: 'var(--sh-text-muted)' };

/**
 * Correspondance clé de discipline → pictogramme et couleur. Les couleurs viennent des tokens de design.
 * Les clés suivent le référentiel alimenté par Garmin ; une clé inconnue reste neutre.
 */
const STYLES: Readonly<Record<string, DisciplineStyle>> = {
  running: { icon: 'run', color: 'var(--sh-success)' },
  cycling: { icon: 'bike', color: 'var(--sh-accent-text)' },
  lap_swimming: { icon: 'swim', color: 'var(--sh-teal)' },
  strength_training: { icon: 'strength', color: 'var(--sh-violet)' },
};

export function disciplineStyleOf(typeKey: string): DisciplineStyle {
  return Object.hasOwn(STYLES, typeKey) ? (STYLES[typeKey] as DisciplineStyle) : NEUTRAL;
}
