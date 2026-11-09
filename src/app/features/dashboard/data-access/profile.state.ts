import { Injectable, Signal, computed, inject, resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ProfileApi } from './profile.api';

/**
 * Nom affiché du compte pour le message d'accueil. `null` tant que le profil n'est pas chargé, s'il est absent,
 * ou en cas d'erreur : le message d'accueil retombe alors sur « Bonjour » seul. Fourni au niveau de la page.
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
    return this.response.value() ?? null;
  });
}
