import { Injectable, signal } from '@angular/core';

/**
 * Fiche d'une séance affichée dans une modale, par-dessus la page courante (sans changer de route).
 * `sessionId` est `null` quand la modale est fermée. `title` est renseigné par la fiche une fois la séance chargée.
 * `backToDay` indique que la séance vient de la modale du jour : la fiche propose alors une flèche de retour, qui la
 * ferme et laisse voir la journée restée ouverte dessous.
 */
@Injectable({ providedIn: 'root' })
export class SessionModalService {
  readonly sessionId = signal<string | null>(null);
  readonly title = signal<string | null>(null);
  readonly backToDay = signal(false);
  /** Nombre de séances supprimées depuis le chargement : les listes qui affichent des séances se rechargent à chaque changement. */
  readonly deletions = signal(0);

  open(sessionId: string, options: { backToDay?: boolean } = {}): void {
    this.title.set(null);
    this.backToDay.set(options.backToDay ?? false);
    this.sessionId.set(sessionId);
  }

  close(): void {
    this.sessionId.set(null);
    this.title.set(null);
    this.backToDay.set(false);
  }

  /** Ferme la fiche après la suppression de la séance et signale aux listes qu'elles doivent se recharger. */
  markDeleted(): void {
    this.deletions.update((count) => count + 1);
    this.close();
  }
}
