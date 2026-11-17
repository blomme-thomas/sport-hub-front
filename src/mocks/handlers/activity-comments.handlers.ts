import { http, HttpResponse } from 'msw';
import type { ActivityCommentApi } from '../../app/features/seances/models/activity-comment.api-model';

/** Commentaires stockés par activité. Vide au départ : l'activité liée à la séance n'a pas encore de commentaire. */
const comments = new Map<string, ActivityCommentApi>();

function commentNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:activity-comment-not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Aucun commentaire pour cette activité.',
      instance: '/api/activities',
      code: 'ACTIVITY_COMMENT_NOT_FOUND',
      correlationId: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const activityCommentsHandlers = [
  http.get('*/api/activities/:id/comment', ({ params }) => {
    const comment = comments.get(String(params['id']));
    return comment === undefined ? commentNotFound() : HttpResponse.json(comment);
  }),
  http.put('*/api/activities/:id/comment', async ({ params, request }) => {
    const id = String(params['id']);
    const body = (await request.json()) as { text: string };
    const comment: ActivityCommentApi = {
      activityId: id,
      text: body.text,
      source: 'saisie-manuelle',
      model: null,
      generatedAt: new Date().toISOString(),
    };
    comments.set(id, comment);
    return HttpResponse.json(comment);
  }),
];
