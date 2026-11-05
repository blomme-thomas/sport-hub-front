// Squelette — à copier dans features/<feature>/<name>.guard.ts (ou core/) puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/05-routing.instructions.md
//
// Guard fonctionnel. (Pas d'authentification dans ce projet : exemple = garde sur une donnée requise.)

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const hasSelectionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const id = route.paramMap.get('id');
  return id ? true : router.createUrlTree(['/']);
};
