import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PausesApi } from './pauses.api';
import type { Pause, PauseInput } from '../models/pause.model';

/**
 * Pauses de la semaine affichée. Chaque chargement remplace la liste ; une réponse périmée (semaine déjà quittée)
 * est ignorée. Les écritures rechargent la semaine après succès ; leur erreur remonte à l'appelant sans effacer la liste.
 * Fourni au niveau de la page.
 */
@Injectable()
export class PausesState {
  private readonly api = inject(PausesApi);
  private readonly pausesValue = signal<readonly Pause[]>([]);
  private latestRequest = 0;
  private from = '';
  private to = '';

  readonly pauses = this.pausesValue.asReadonly();

  async load(from: string, to: string): Promise<void> {
    this.from = from;
    this.to = to;
    const request = ++this.latestRequest;
    try {
      const items = await firstValueFrom(this.api.list(from, to));
      if (request === this.latestRequest) {
        this.pausesValue.set(items);
      }
    } catch {
      // L'intercepteur d'erreurs notifie l'utilisateur ; la liste précédente reste affichée.
    }
  }

  async create(body: PauseInput): Promise<void> {
    await firstValueFrom(this.api.create(body));
    await this.reload();
  }

  async update(id: string, body: PauseInput): Promise<void> {
    await firstValueFrom(this.api.update(id, body));
    await this.reload();
  }

  async remove(id: string): Promise<void> {
    await firstValueFrom(this.api.remove(id));
    await this.reload();
  }

  private async reload(): Promise<void> {
    await this.load(this.from, this.to);
  }
}
