import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { catchError, throwError } from 'rxjs';
import { AppError } from './app-error';

/** Normalise les erreurs HTTP en AppError et notifie l'utilisateur par un message. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messages = inject(NzMessageService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const message =
        err.status === 0
          ? 'API injoignable'
          : ((err.error as { message?: string } | null)?.message ?? 'Erreur inattendue');
      messages.error(message);
      return throwError(() => new AppError(message, err.status));
    }),
  );
};
