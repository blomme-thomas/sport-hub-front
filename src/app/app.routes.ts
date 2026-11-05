import { Routes } from '@angular/router';

// Chaque feature s'ajoute ici en lazy :
// { path: 'activities', loadChildren: () => import('./features/activities/activities.routes').then((m) => m.ACTIVITIES_ROUTES) }
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Accueil',
    loadComponent: () => import('./core/layout/home.page').then((m) => m.HomePage),
  },
  {
    path: '**',
    title: 'Page introuvable',
    loadComponent: () => import('./core/layout/not-found.page').then((m) => m.NotFoundPage),
  },
];
