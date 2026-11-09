import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type {
  CreateSlotRequestApi,
  SlotApi,
  SlotOccurrencesResponseApi,
  UpdateSlotRequestApi,
} from '../models/slot.api-model';
import type { Slot } from '../models/slot.model';
import { toSavedSlot, toSlot } from './slot.mapper';

/** Accès HTTP aux créneaux ; les réponses sont mappées en modèle UI, les erreurs remontent telles quelles. */
@Injectable({ providedIn: 'root' })
export class SlotsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Occurrences des créneaux entre `from` et `to` (`YYYY-MM-DD`, bornes incluses). */
  list(from: string, to: string): Observable<Slot[]> {
    const params = new HttpParams({ fromObject: { from, to } });
    return this.http
      .get<SlotOccurrencesResponseApi>(`${this.baseUrl}/slots`, { params })
      .pipe(map((response) => response.items.map(toSlot)));
  }

  create(body: CreateSlotRequestApi): Observable<Slot> {
    return this.http.post<SlotApi>(`${this.baseUrl}/slots`, body).pipe(map(toSavedSlot));
  }

  update(id: string, body: UpdateSlotRequestApi): Observable<Slot> {
    return this.http
      .patch<SlotApi>(`${this.baseUrl}/slots/${encodeURIComponent(id)}`, body)
      .pipe(map(toSavedSlot));
  }

  delete(id: string): Observable<null> {
    return this.http.delete<null>(`${this.baseUrl}/slots/${encodeURIComponent(id)}`);
  }
}
