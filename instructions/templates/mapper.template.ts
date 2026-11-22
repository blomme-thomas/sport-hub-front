// Squelette — à copier dans features/<feature>/data-access/<name>.mapper.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/04-data-access-and-http.instructions.md
//
// Fonctions pures DTO API -> modèle UI (et inverse). Dates, unités et valeurs par défaut normalisées ici, une seule fois.

export interface ActivityApi {
  id: string;
  sport: string;
  startTime: string; // ISO 8601
  durationSeconds: number;
  distanceMeters: number | null;
}

export interface Activity {
  id: string;
  sport: string;
  startedAt: Date;
  durationMin: number;
  distanceKm: number;
}

export function toActivity(api: ActivityApi): Activity {
  return {
    id: api.id,
    sport: api.sport,
    startedAt: new Date(api.startTime),
    durationMin: Math.round(api.durationSeconds / 60),
    distanceKm: (api.distanceMeters ?? 0) / 1000,
  };
}
