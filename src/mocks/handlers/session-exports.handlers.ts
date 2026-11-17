import { http, HttpResponse } from 'msw';

/** Bilan JSON d'une séance pour le développement sans back. Le contenu réel est produit par le back. */
export const sessionExportsHandlers = [
  http.get('*/api/exports/sessions/:id', ({ params }) =>
    HttpResponse.json(
      {
        format: 'bilan-seance',
        kind: 'bilan-seance',
        schemaVersion: 1,
        sessionId: String(params['id']),
        notesPourLAnalyse: 'Fichier de démonstration (mock MSW).',
      },
      { headers: { 'content-disposition': 'attachment; filename="bilan-seance.json"' } },
    ),
  ),
];
