import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../core/config/api-base-url.token';
import type { HeartRateZonesApi, ZoneFloors } from '../models/heart-rate-zones.model';

/** Lecture des zones de fréquence cardiaque : `GET /api/heart-rate-zones`. */
@Injectable({ providedIn: 'root' })
export class HeartRateZonesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Bornes basses des zones, ou `null` si les zones ne sont pas disponibles. */
  get(): Observable<ZoneFloors | null> {
    return this.http.get<HeartRateZonesApi>(`${this.baseUrl}/heart-rate-zones`).pipe(map(toFloors));
  }
}

function toFloors(api: HeartRateZonesApi): ZoneFloors | null {
  const { zone1Floor: z1, zone2Floor: z2, zone3Floor: z3, zone4Floor: z4, zone5Floor: z5 } = api;
  if (!api.available || z1 === null || z2 === null || z3 === null || z4 === null || z5 === null) {
    return null;
  }
  return [z1, z2, z3, z4, z5];
}
