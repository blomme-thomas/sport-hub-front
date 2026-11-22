import { http, HttpResponse } from 'msw';

// Handlers par défaut du contrat de sport-hub-back (GET /health). Garder synchronisés avec les *.api-model.ts.
export const healthHandlers = [http.get('*/health', () => HttpResponse.json({ status: 'ok' }))];
