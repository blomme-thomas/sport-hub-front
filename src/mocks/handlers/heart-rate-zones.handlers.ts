import { http, HttpResponse } from 'msw';

/** Zones de FC de référence (FC max 204, méthode HR_MAX). */
export const heartRateZonesHandlers = [
  http.get('*/api/heart-rate-zones', () =>
    HttpResponse.json({
      available: true,
      trainingMethod: 'HR_MAX',
      maxHeartRateUsed: 204,
      restingHeartRateUsed: 51,
      zone1Floor: 102,
      zone2Floor: 122,
      zone3Floor: 143,
      zone4Floor: 163,
      zone5Floor: 184,
    }),
  ),
];
