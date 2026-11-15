import { http, HttpResponse } from 'msw';
import type { ActivityCommentApi } from '../../app/features/dashboard/models/activity-comment.api-model';
import { activityCommentApi } from '../fixtures/activity-comment.fixtures';

/** Commentaires stockés par activité. Aucune activité n'en a au départ : la génération l'ajoute. */
const comments = new Map<string, ActivityCommentApi>();

function commentNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:activity-comment-not-found',
      title: 'Not Found',
      status: 404,
      detail: "Aucun commentaire n'a encore été généré pour cette activité.",
      instance: '/api/activities',
      code: 'ACTIVITY_COMMENT_NOT_FOUND',
      correlationId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const activityCommentsHandlers = [
  http.get('*/api/activities/:id/comment', ({ params }) => {
    const comment = comments.get(String(params['id']));
    return comment === undefined ? commentNotFound() : HttpResponse.json(comment);
  }),
  http.post('*/api/activities/:id/comment', ({ params }) => {
    const id = String(params['id']);
    const comment: ActivityCommentApi = {
      ...activityCommentApi,
      activityId: id,
      generatedAt: new Date().toISOString(),
    };
    comments.set(id, comment);
    return HttpResponse.json(comment, { status: 201 });
  }),
];
