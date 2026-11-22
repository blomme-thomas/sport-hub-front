import { Routes } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.dashboard.title,
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
  },
];
