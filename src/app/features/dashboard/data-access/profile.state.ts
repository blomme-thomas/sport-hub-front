import { Injectable, Signal, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProfileApi } from './profile.api';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Nom lisible pour le message d'accueil. Garmin renvoie parfois un identifiant technique (UUID) à la place du
 * nom : il n'est jamais affiché, le message retombe alors sur « Bonjour » seul.
 */
export function visibleDisplayName(value: string | null): string | null {
  if (value === null || UUID_PATTERN.test(value.trim())) {
    return null;
  }
  return value;
}

/**
 * Nom affiché du compte pour le message d'accueil. `null` tant que le profil n'est pas chargé, s'il est absent,
 * s'il s'agit d'un identifiant technique, ou en cas d'erreur. Fourni au niveau de la page.
 */
@Injectable()
export class ProfileState {
  private readonly api = inject(ProfileApi);

  private readonly response = resource<string | null, void>({
    loader: () => firstValueFrom(this.api.displayName()),
  });

  readonly displayName: Signal<string | null> = computed(() => {
    if (this.response.error() !== undefined || !this.response.hasValue()) {
      return null;
    }
    return visibleDisplayName(this.response.value() ?? null);
  });
}
