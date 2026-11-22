// Squelette — à copier dans features/<feature>/data-access/<name>.api.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/04-data-access-and-http.instructions.md
//
// Seul endroit (avec core/http) qui parle HTTP. Retourne des modèles UI (mappés), jamais des DTO API bruts.

import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, Signal, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
// import { API_BASE_URL } from '../../../core/config/api-base-url.token';
// import { ExampleApi } from '../models/example.api-model';
// import { Example } from '../models/example.model';
// import { toExample } from './example.mapper';

interface ExampleApi { id: string; label: string; startedAt: string }
interface Example { id: string; label: string; startedAt: Date }
const API_BASE_URL = '' as unknown as never; // → InjectionToken importé depuis core/config
const toExample = (a: ExampleApi): Example => ({ ...a, startedAt: new Date(a.startedAt) });

@Injectable({ providedIn: 'root' })
export class ExampleApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject<string>(API_BASE_URL);

  // Lecture ponctuelle
  getById(id: string): Observable<Example> {
    return this.http.get<ExampleApi>(`${this.baseUrl}/examples/${id}`).pipe(map(toExample));
  }

  // Écriture
  create(payload: { label: string }): Observable<Example> {
    return this.http.post<ExampleApi>(`${this.baseUrl}/examples`, payload).pipe(map(toExample));
  }

  // Lecture pilotée par un signal (recharge automatiquement quand le signal change)
  listResource(filter: Signal<{ sport?: string }>) {
    return httpResource<ExampleApi[]>(() => ({
      url: `${this.baseUrl}/examples`,
      params: { ...filter() },
    }));
    // puis : computed(() => resource.value()?.map(toExample) ?? [])
  }
}
