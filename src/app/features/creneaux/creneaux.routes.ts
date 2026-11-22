import { Routes } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

export const CRENEAUX_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.creneaux.title,
    loadComponent: () => import('./pages/creneaux.page').then((m) => m.CreneauxPage),
  },
];
