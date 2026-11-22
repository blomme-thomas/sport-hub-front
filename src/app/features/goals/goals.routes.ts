import { Routes } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TEXTS } from '@shared/texts/texts';

export const GOALS_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.goals.title,
    // Le service de modale ng-zorro n'est fourni qu'ici : il ne fait pas partie du bundle de démarrage.
    providers: [NzModalService],
    loadComponent: () => import('./pages/goals.page').then((m) => m.GoalsPage),
  },
];
