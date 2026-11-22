// Squelette — à copier à côté du service : <name>.api.spec.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/09-testing.instructions.md
//
// Service API testé avec MSW (réponse HTTP réaliste) ; le serveur MSW est démarré dans le setup Vitest.

import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { http, HttpResponse } from 'msw';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
// import { server } from '../../../../mocks/server';
// import { ExampleApiService } from './example.api';

declare const server: { use: (...h: unknown[]) => void };
declare const ExampleApiService: never;

describe('ExampleApiService', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withFetch()) /*, { provide: API_BASE_URL, useValue: 'http://api.test' } */],
    });
    return TestBed.inject(ExampleApiService) as { getById(id: string): import('rxjs').Observable<{ startedAt: Date }> };
  }

  it('mappe la date ISO en Date', async () => {
    server.use(http.get('http://api.test/examples/1', () => HttpResponse.json({ id: '1', label: 'x', startedAt: '2026-01-01T10:00:00Z' })));

    const result = await firstValueFrom(setup().getById('1'));

    expect(result.startedAt).toBeInstanceOf(Date);
  });

  it('propage l\'erreur HTTP', async () => {
    server.use(http.get('http://api.test/examples/1', () => new HttpResponse(null, { status: 500 })));

    await expect(firstValueFrom(setup().getById('1'))).rejects.toBeTruthy();
  });
});
