import { Routes } from '@angular/router';

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
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./core/layout/not-found.page').then((m) => m.NotFoundPage),
  },
];
