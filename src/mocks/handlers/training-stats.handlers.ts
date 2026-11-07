import { http, HttpResponse } from 'msw';
import { monthStatsResponse, normalStatsResponse } from '../fixtures/training-stats.fixtures';

export const trainingStatsHandlers = [
  http.get('*/api/stats', ({ request }) => {
    const granularity = new URL(request.url).searchParams.get('granularity');
    return HttpResponse.json(granularity === 'month' ? monthStatsResponse : normalStatsResponse);
  }),
];
