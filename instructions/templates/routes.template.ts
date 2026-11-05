// Squelette — à copier dans features/<feature>/<feature>.routes.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/05-routing.instructions.md

import { Routes } from '@angular/router';

export const EXAMPLE_ROUTES: Routes = [
  {
    path: '',
    // providers: [ExampleState],  // durée de vie de l'état = durée de vie de la route
    children: [
      {
        path: '',
        title: 'Exemples',
        loadComponent: () => import('./pages/example-list.page').then((m) => m.ExampleListPage),
      },
      {
        path: ':id', // lié à input() du composant via withComponentInputBinding()
        title: 'Détail',
        loadComponent: () => import('./pages/example-detail.page').then((m) => m.ExampleDetailPage),
      },
    ],
  },
];

// Dans app.routes.ts :
// { path: 'examples', loadChildren: () => import('./features/example/example.routes').then((m) => m.EXAMPLE_ROUTES) },
// { path: '**', loadComponent: () => import('./core/layout/not-found.page').then((m) => m.NotFoundPage) },
