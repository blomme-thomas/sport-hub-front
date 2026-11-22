import { http, HttpResponse } from 'msw';
import type { WeeklyReviewApi } from '../../app/features/dashboard/models/weekly-review.api-model';
import { weeklyReviewApi } from '../fixtures/weekly-review.fixtures';

/** Bilans stockés par semaine ISO. La semaine de référence est pré-remplie. */
const reviews = new Map<string, WeeklyReviewApi>([[weeklyReviewApi.week, weeklyReviewApi]]);

function reviewNotFound(): Response {
  return HttpResponse.json(
    {
      type: 'urn:sport-hub:problem:weekly-review-not-found',
      title: 'Not Found',
      status: 404,
      detail: 'Bilan introuvable.',
      instance: '/api/weekly-reviews',
      code: 'WEEKLY_REVIEW_NOT_FOUND',
      correlationId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    },
    { status: 404, headers: { 'content-type': 'application/problem+json' } },
  );
}

export const weeklyReviewsHandlers = [
  http.get('*/api/weekly-reviews/:week', ({ params }) => {
    const review = reviews.get(String(params['week']));
    return review === undefined ? reviewNotFound() : HttpResponse.json(review);
  }),
  http.post('*/api/weekly-reviews/:week', ({ params }) => {
    const week = String(params['week']);
    const review: WeeklyReviewApi = {
      ...weeklyReviewApi,
      week,
      generatedAt: new Date().toISOString(),
    };
    reviews.set(week, review);
    return HttpResponse.json(review, { status: 201 });
  }),
];
