import { render, screen } from '@testing-library/angular';
import { routes } from './app.routes';
import { App } from './app';

describe('App', () => {
  it("affiche la coque et la page d'accueil", async () => {
    await render(App, { routes });

    expect(await screen.findByRole('heading', { name: 'Sport Hub' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sport Hub' })).toBeInTheDocument();
  });
});
