import { Routes } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

export const GOALS_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.goals.title,
    loadComponent: () => import('./pages/goals.page').then((m) => m.GoalsPage),
  },
];
