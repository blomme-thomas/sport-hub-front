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
  });

  it('affiche les entrées à venir désactivées, sans lien', async () => {
    await setup();

    const comingSoon = screen.getByText('Statistiques');
    expect(comingSoon).toHaveAttribute('aria-disabled', 'true');
    expect(comingSoon).toHaveAttribute('title', 'Bientôt disponible');
    expect(screen.queryByRole('link', { name: 'Statistiques' })).not.toBeInTheDocument();
  });

  it('ouvre et ferme le menu mobile avec aria-expanded', async () => {
    const user = userEvent.setup();
    await setup();
    const toggle = screen.getByRole('button', { name: 'Ouvrir le menu' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument();
  });

  it('ferme le menu avec la touche Échap', async () => {
    const user = userEvent.setup();
    await setup();
    await user.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    screen.getByRole('link', { name: 'Objectifs' }).focus();

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Ouvrir le menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });
});
