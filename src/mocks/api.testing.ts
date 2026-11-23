import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ANIMATION_MODULE_TYPE } from '@angular/core';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { vi } from 'vitest';
import { API_BASE_URL } from '../app/core/config/api-base-url.token';
import { errorInterceptor } from '../app/core/http/error.interceptor';

export const TEST_API_URL = 'http://api.test/api';

/** Fournisseurs d'un écran qui appelle l'API : HttpClient avec l'intercepteur d'erreurs, URL de test, messages et modales. */
export function apiTestProviders() {
  return [
    provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
    { provide: API_BASE_URL, useValue: TEST_API_URL },
    { provide: NzMessageService, useValue: { error: vi.fn(), success: vi.fn() } },
    NzModalService,
    { provide: ANIMATION_MODULE_TYPE, useValue: 'NoopAnimations' },
  ];
}
