import { http, HttpResponse } from 'msw';
import type { UserSettingsApi } from '../../app/features/reglages/models/user-settings.api-model';

/** Réglages stockés : pas de cible au départ, comme un premier lancement. */
const settings: UserSettingsApi = { weeklyTargetSeconds: null };

/** Cible hebdomadaire courante, lue aussi par la progression du tableau de bord. */
export function storedWeeklyTargetSeconds(): number | null {
  return settings.weeklyTargetSeconds;
}

export const userSettingsHandlers = [
  http.get('*/api/settings', () => HttpResponse.json(settings)),
  http.put('*/api/settings', async ({ request }) => {
    const body = (await request.json()) as { weeklyTargetSeconds: number | null };
    settings.weeklyTargetSeconds = body.weeklyTargetSeconds;
    return HttpResponse.json(settings);
  }),
];
