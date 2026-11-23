import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ShellComponent } from './shell.component';

function setup() {
  return render(ShellComponent, { providers: [provideRouter([])] });
}

describe('ShellComponent', () => {
  it('affiche les liens actifs « Tableau de bord » et « Objectifs »', async () => {
    await setup();

    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'Objectifs' })).toHaveAttribute('href', '/goals');
    expect(screen.getByRole('link', { name: 'Calendrier' })).toHaveAttribute('href', '/creneaux');
    expect(screen.getByRole('link', { name: 'Nutrition' })).toHaveAttribute('href', '/nutrition');
  });

  it('affiche les entrées à venir désactivées, sans lien', async () => {
    await setup();

    const comingSoon = screen.getByText('Statistiques');
    expect(comingSoon).toHaveAttribute('aria-disabled', 'true');
    expect(comingSoon).toHaveAttribute('title', 'Bientôt disponible');
    expect(screen.queryByRole('link', { name: 'Statistiques' })).not.toBeInTheDocument();
  });

  // Le bouton est masqué en CSS au-delà de 768px. jsdom applique désormais ces media queries : il
  // n'a plus de nom accessible, on cible donc l'unique bouton de la page.
  it('ouvre et ferme le menu mobile avec aria-expanded', async () => {
    const user = userEvent.setup();
    await setup();
    const toggle = screen.getByRole('button', { hidden: true });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('ferme le menu avec la touche Échap', async () => {
    const user = userEvent.setup();
    await setup();
    await user.click(screen.getByRole('button', { hidden: true }));
    screen.getByRole('link', { name: 'Objectifs' }).focus();

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { hidden: true })).toHaveAttribute('aria-expanded', 'false');
  });
});
