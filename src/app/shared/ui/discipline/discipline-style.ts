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
const RUN: DisciplineStyle = { icon: 'run', color: 'var(--sh-success)' };
const BIKE: DisciplineStyle = { icon: 'bike', color: 'var(--sh-accent-text)' };
const SWIM: DisciplineStyle = { icon: 'swim', color: 'var(--sh-teal)' };

/**
 * Familles de sport (course, vélo, natation) reprises du back (sport-family.vo.ts) : le référentiel des
 * disciplines ne porte pas encore la famille, donc chaque type de la famille est listé ici.
 */
const STYLES: Readonly<Record<string, DisciplineStyle>> = {
  running: RUN,
  trail_running: RUN,
  treadmill_running: RUN,
  track_running: RUN,
  cycling: BIKE,
  road_biking: BIKE,
  indoor_cycling: BIKE,
  virtual_ride: BIKE,
  gravel_cycling: BIKE,
  mountain_biking: BIKE,
  e_bike_fitness: BIKE,
  swimming: SWIM,
  lap_swimming: SWIM,
  open_water_swimming: SWIM,
  strength_training: { icon: 'strength', color: 'var(--sh-violet)' },
};

export function disciplineStyleOf(typeKey: string): DisciplineStyle {
  return Object.hasOwn(STYLES, typeKey) ? (STYLES[typeKey] as DisciplineStyle) : NEUTRAL;
}
