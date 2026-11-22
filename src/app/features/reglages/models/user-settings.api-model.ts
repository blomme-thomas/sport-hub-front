/** Réglages tels que renvoyés par `GET` et `PUT /api/settings`. */
export interface UserSettingsApi {
  /** Cible hebdomadaire en secondes, null si aucune n'est définie. */
  weeklyTargetSeconds: number | null;
}
