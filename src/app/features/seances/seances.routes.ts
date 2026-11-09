import { Routes } from '@angular/router';

export const SEANCES_ROUTES: Routes = [
  {
    path: ':id',
    title: 'Séance',
    loadComponent: () => import('./pages/session.page').then((m) => m.SessionPage),
  },
];
