import { Routes } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

export const REGLAGES_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.reglages.title,
    loadComponent: () => import('./pages/reglages.page').then((m) => m.ReglagesPage),
  },
];
