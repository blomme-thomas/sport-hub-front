import { http, HttpResponse } from 'msw';

export const profileHandlers = [
  http.get('*/api/profile', () => HttpResponse.json({ displayName: 'Thomas' })),
];
