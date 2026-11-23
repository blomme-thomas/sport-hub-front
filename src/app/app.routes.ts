import { Routes } from '@angular/router';
import { TEXTS } from '@shared/texts/texts';

// Chaque feature s'ajoute ici en lazy :
// { path: 'activities', loadChildren: () => import('./features/activities/activities.routes').then((m) => m.ACTIVITIES_ROUTES) }
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'goals',
    loadChildren: () => import('./features/goals/goals.routes').then((m) => m.GOALS_ROUTES),
  },
  {
    path: 'creneaux',
    loadChildren: () =>
      import('./features/creneaux/creneaux.routes').then((m) => m.CRENEAUX_ROUTES),
  },
  {
    path: 'nutrition',
    loadChildren: () =>
      import('./features/nutrition/nutrition.routes').then((m) => m.NUTRITION_ROUTES),
  },
  {
    path: 'parametres',
    loadChildren: () =>
      import('./features/reglages/reglages.routes').then((m) => m.REGLAGES_ROUTES),
  },
  {
    path: '**',
    title: TEXTS.shell.notFound.title,
    loadComponent: () => import('./core/layout/not-found.page').then((m) => m.NotFoundPage),
  },
];
