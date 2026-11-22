import { http, HttpResponse } from 'msw';
import { recentActivitiesResponse } from '../fixtures/activities.fixtures';

export const activitiesHandlers = [
  http.get('*/api/activities', () => HttpResponse.json(recentActivitiesResponse)),
];
