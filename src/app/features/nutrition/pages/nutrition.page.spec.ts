import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NutritionPage } from './nutrition.page';

/** Monte la page via le routeur, comme l'app : l'onglet est lu dans l'URL de navigation. */
async function setup(url = '/nutrition') {
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: 'nutrition', component: NutritionPage }])],
  });
  const harness = await RouterTestingHarness.create(url);
  return {
    screen: within(harness.routeNativeElement!),
    router: TestBed.inject(Router),
  };
}

describe('NutritionPage', () => {
  it('affiche les deux onglets, « Mes recettes » sélectionné par défaut', async () => {
    const { screen } = await setup();

    const recipes = screen.getByRole('tab', { name: 'Mes recettes' });
    const foods = screen.getByRole('tab', { name: 'Mes aliments' });
    expect(recipes).toHaveAttribute('aria-selected', 'true');
    expect(foods).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', recipes.id);
  });

  it('change d’onglet au clic et met l’URL à jour', async () => {
    const user = userEvent.setup();
    const { screen, router } = await setup();

    await user.click(screen.getByRole('tab', { name: 'Mes aliments' }));

    expect(screen.getByRole('tab', { name: 'Mes aliments' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tabpanel')).toHaveAttribute(
      'aria-labelledby',
      'nutrition-tab-aliments',
    );
    await vi.waitFor(() => expect(router.url).toBe('/nutrition?onglet=aliments'));
  });

  it('restaure l’onglet depuis l’URL', async () => {
    const { screen } = await setup('/nutrition?onglet=aliments');

    expect(screen.getByRole('tab', { name: 'Mes aliments' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Mes recettes' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('ignore une valeur inconnue dans l’URL et revient à « Mes recettes »', async () => {
    const { screen } = await setup('/nutrition?onglet=inconnu');

    expect(screen.getByRole('tab', { name: 'Mes recettes' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('se déplace avec les flèches, avec retour en boucle, et déplace le focus', async () => {
    const user = userEvent.setup();
    const { screen } = await setup();
    screen.getByRole('tab', { name: 'Mes recettes' }).focus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Mes aliments' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('tab', { name: 'Mes aliments' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Mes recettes' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Mes aliments' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('va au début et à la fin avec Début et Fin', async () => {
    const user = userEvent.setup();
    const { screen } = await setup();
    screen.getByRole('tab', { name: 'Mes recettes' }).focus();

    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Mes aliments' })).toHaveAttribute(
      'aria-selected',
      'true',
    );

    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Mes recettes' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('garde les autres paramètres de l’URL', async () => {
    const user = userEvent.setup();
    const { screen, router } = await setup('/nutrition?autre=1');

    await user.click(screen.getByRole('tab', { name: 'Mes aliments' }));

    await vi.waitFor(() => expect(router.url).toBe('/nutrition?autre=1&onglet=aliments'));
  });
});
