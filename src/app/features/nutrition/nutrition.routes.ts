import { Routes } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TEXTS } from '@shared/texts/texts';

export const NUTRITION_ROUTES: Routes = [
  {
    path: '',
    title: TEXTS.nutrition.title,
    // Le service de modale ng-zorro est fourni ici, comme pour les objectifs et le calendrier : la modale d'aliment en a besoin.
    providers: [NzModalService],
    loadComponent: () => import('./pages/nutrition.page').then((m) => m.NutritionPage),
  },
];
