/** Seuils des zones de fréquence cardiaque de l'utilisateur (`GET /api/heart-rate-zones`). */
export interface HeartRateZonesApi {
  available: boolean;
  zone1Floor: number | null;
  zone2Floor: number | null;
  zone3Floor: number | null;
  zone4Floor: number | null;
  zone5Floor: number | null;
}

/** Bornes basses des zones 1 à 5, en bpm. `null` si les zones ne sont pas disponibles. */
export type ZoneFloors = readonly [number, number, number, number, number];

/**
 * Numéro de zone (1 à 5) d'une fréquence cardiaque, à partir des bornes basses.
 * En dessous de la zone 1, la zone 1 est retenue. `null` si les bornes manquent.
 */
export function zoneOf(bpm: number, floors: ZoneFloors | null): number | null {
  if (floors === null) {
    return null;
  }
  let zone = 1;
  floors.forEach((floor, index) => {
    if (bpm >= floor) {
      zone = index + 1;
    }
  });
  return zone;
}
