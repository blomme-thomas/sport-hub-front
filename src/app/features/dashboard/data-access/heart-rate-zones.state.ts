import { Injectable, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import type { ZoneFloors } from '../models/heart-rate-zones.model';
import { HeartRateZonesService } from './heart-rate-zones.api';

/**
 * Seuils des zones de FC, chargés une fois pour la page. `floors()` vaut `null` tant que les zones ne sont pas
 * reçues ou si elles ne sont pas disponibles : les courbes gardent alors une couleur neutre.
 */
@Injectable()
export class HeartRateZonesState {
  private readonly service = inject(HeartRateZonesService);

  private readonly response = resource<ZoneFloors | null, void>({
    loader: () => firstValueFrom(this.service.get()),
  });

  readonly floors = computed<ZoneFloors | null>(() =>
    this.response.hasValue() ? (this.response.value() ?? null) : null,
  );
}
