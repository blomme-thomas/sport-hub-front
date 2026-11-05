// Squelette — à copier dans core/http/<name>.interceptor.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/04-data-access-and-http.instructions.md
//
// Intercepteur fonctionnel : normalise les erreurs HTTP. Enregistré via provideHttpClient(withInterceptors([errorInterceptor])).

import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
// import { NzMessageService } from 'ng-zorro-antd/message';

export class AppError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // const messages = inject(NzMessageService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message = err.status === 0 ? 'API injoignable' : (err.error?.message ?? 'Erreur inattendue');
      // messages.error(message);
      return throwError(() => new AppError(message, err.status));
    }),
  );
};
