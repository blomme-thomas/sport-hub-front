import { Routes } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.nutrition.title,
    loadComponent: () => import('./pages/nutrition.page').then((m) => m.NutritionPage),
  },
];
