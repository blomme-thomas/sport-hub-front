import { Routes } from '@angular/router';

export const CRENEAUX_ROUTES: Routes = [
  {
    path: '',
    title: 'Disponibilités',
    loadComponent: () => import('./pages/creneaux.page').then((m) => m.CreneauxPage),
  },
];
