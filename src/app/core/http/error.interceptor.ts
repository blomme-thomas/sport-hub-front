import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, throwError } from 'rxjs';
import { toAppError } from './problem-details.mapper';

/**
 * Normalise toute erreur HTTP en `AppError`, notifie toujours `userMessage` et relance l'`AppError`.
 * Les erreurs de validation sont donc notifiées en plus de leurs erreurs par champ (double notification assumée).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(NzMessageService);

  return next(req).pipe(
    catchError((err: unknown) => {
      const appError = toAppError(err);
      messages.error(appError.userMessage);
      return throwError(() => appError);
    }),
  );
};
