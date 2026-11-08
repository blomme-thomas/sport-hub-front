import { http, HttpResponse } from 'msw';
import { dashboardKpisResponse } from '../fixtures/dashboard-kpis.fixtures';

export const dashboardKpisHandlers = [
  http.get('*/api/stats/dashboard', () => HttpResponse.json(dashboardKpisResponse)),
];
