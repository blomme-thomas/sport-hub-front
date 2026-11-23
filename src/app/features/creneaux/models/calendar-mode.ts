/** Mode du calendrier : séances (fonctionnement habituel) ou alimentation (repas de la semaine). */
export const CALENDAR_MODES = ['seances', 'alimentation'] as const;

export type CalendarMode = (typeof CALENDAR_MODES)[number];

/** Clé de `sessionStorage` : le mode choisi reste pour la session du navigateur (hypothèse à valider). */
const STORAGE_KEY = 'sport-hub.calendrier.mode';

/** Mode mémorisé pour la session, ou « séances » si rien n'est mémorisé ou si le stockage est indisponible. */
export function readStoredCalendarMode(): CalendarMode {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'alimentation' ? 'alimentation' : 'seances';
  } catch {
    return 'seances';
  }
}

/** Mémorise le mode. Un stockage indisponible (navigation privée, données bloquées) n'empêche pas le changement. */
export function storeCalendarMode(mode: CalendarMode): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Le choix vaut pour cet écran seulement.
  }
}
