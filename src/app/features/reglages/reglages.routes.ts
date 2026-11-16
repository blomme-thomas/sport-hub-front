import { Routes } from '@angular/router';

export const REGLAGES_ROUTES: Routes = [
  {
    path: '',
    title: 'Paramètres',
    loadComponent: () => import('./pages/reglages.page').then((m) => m.ReglagesPage),
  },
];
