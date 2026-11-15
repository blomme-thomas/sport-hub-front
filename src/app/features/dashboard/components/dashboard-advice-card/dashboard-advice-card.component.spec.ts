import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  adviceApi,
  insufficientAdviceApi,
} from '../../../../../mocks/fixtures/dashboard-advice.fixtures';
import { toDashboardAdvice } from '../../data-access/dashboard-advice.mapper';
import { DashboardAdviceCardComponent } from './dashboard-advice-card.component';

const advice = toDashboardAdvice(adviceApi);

describe('DashboardAdviceCardComponent', () => {
  it('affiche le conseil en texte brut, avec sa date de génération', async () => {
    await render(DashboardAdviceCardComponent, { inputs: { advice } });

    expect(screen.getByText(adviceApi.text)).toBeInTheDocument();
    expect(screen.getByText(/Généré le/)).toBeInTheDocument();
  });

  it('n’interprète pas le HTML du texte', async () => {
    await render(DashboardAdviceCardComponent, {
      inputs: { advice: { ...advice, text: '<b>gras</b>' } },
    });

    expect(screen.getByText('<b>gras</b>')).toBeInTheDocument();
    expect(document.querySelector('b')).toBeNull();
  });

  it('affiche un conseil insuffisant en clair, sans alerte', async () => {
    await render(DashboardAdviceCardComponent, {
      inputs: { advice: toDashboardAdvice(insufficientAdviceApi) },
    });

    expect(
      screen.getByText('Données insuffisantes pour un conseil cette semaine.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('propose de générer le conseil quand il n’existe pas encore', async () => {
    const user = userEvent.setup();
    const generate = vi.fn();
    await render(DashboardAdviceCardComponent, { inputs: { advice: null }, on: { generate } });

    await user.click(screen.getByRole('button', { name: 'Générer le conseil' }));

    expect(generate).toHaveBeenCalledOnce();
  });

  it('régénère le conseil au clic, et désactive le bouton pendant la génération', async () => {
    const user = userEvent.setup();
    const generate = vi.fn();
    const { fixture } = await render(DashboardAdviceCardComponent, {
      inputs: { advice, generating: false },
      on: { generate },
    });

    await user.click(screen.getByRole('button', { name: 'Régénérer' }));
    expect(generate).toHaveBeenCalledOnce();

    fixture.componentRef.setInput('generating', true);
    fixture.detectChanges();
    expect(screen.getByRole('button', { name: 'Régénérer' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Génération en cours…');
  });

  it('désactive « Voir le plan d’entraînement » tant que la page n’existe pas', async () => {
    await render(DashboardAdviceCardComponent, { inputs: { advice } });

    expect(screen.getByRole('button', { name: 'Voir le plan d’entraînement' })).toBeDisabled();
  });

  it('affiche l’erreur avec un bouton pour réessayer', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    await render(DashboardAdviceCardComponent, {
      inputs: { advice: null, errorMessage: 'Le service est indisponible.' },
      on: { retry },
    });

    expect(screen.getByRole('alert')).toHaveTextContent('Le service est indisponible.');
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
