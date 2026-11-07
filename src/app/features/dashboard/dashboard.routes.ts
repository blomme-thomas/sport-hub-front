import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    title: 'Tableau de bord',
    loadComponent: () => import('./pages/dashboard.page').then((m) => m.DashboardPage),
  },
];
