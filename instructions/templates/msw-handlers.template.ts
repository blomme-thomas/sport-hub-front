// Squelette — à copier dans src/mocks/handlers/<feature>.handlers.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/09-testing.instructions.md, 09b
//
// Handlers MSW par défaut, partagés entre tests unitaires (server.ts / Node), E2E et dev (browser.ts).
// Un test surcharge un handler avec server.use(...) pour simuler une erreur.
// Les données reflètent le contrat de sport-hub-back : les garder synchronisées avec les *.api-model.ts.

import { http, HttpResponse } from 'msw';

const API = 'http://localhost:3000'; // aligner sur API_BASE_URL de l'environnement

export const activitiesHandlers = [
  http.get(`${API}/activities`, () =>
    HttpResponse.json([
      { id: 'a1', sport: 'running', startTime: '2026-10-01T07:30:00Z', durationSeconds: 3600, distanceMeters: 10000 },
    ]),
  ),
  http.get(`${API}/activities/:id`, ({ params }) =>
    HttpResponse.json({ id: params['id'], sport: 'running', startTime: '2026-10-01T07:30:00Z', durationSeconds: 3600, distanceMeters: 10000 }),
  ),
];

// src/mocks/server.ts   : export const server = setupServer(...activitiesHandlers);          (msw/node)
// src/mocks/browser.ts  : export const worker = setupWorker(...activitiesHandlers);           (msw/browser)
