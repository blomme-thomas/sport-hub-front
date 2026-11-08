import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

/** Entrées du menu pas encore disponibles : affichées, non cliquables. */
const COMING_SOON = ['Entraînements', 'Statistiques', 'Conseils IA', 'Paramètres'] as const;

/** Coque de l'application : sidebar de navigation et zone de contenu routée. */
@Component({
  selector: 'sh-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'closeMenu()' },
})
export class ShellComponent {
  protected readonly comingSoon = COMING_SOON;
  /** Ouverture du menu sur petit écran (tiroir). Sans effet au-dessus de 768 px. */
  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
