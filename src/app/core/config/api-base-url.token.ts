import { InjectionToken } from '@angular/core';

/** URL de base de l'API sport-hub-back, alimentée par l'environnement (app.config.ts). */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
