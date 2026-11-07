import { Routes } from '@angular/router';

export const GOALS_ROUTES: Routes = [
  {
    path: '',
    title: 'Objectifs',
    loadComponent: () => import('./pages/goals.page').then((m) => m.GoalsPage),
  },
];
