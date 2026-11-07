import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { goalsTestProviders } from '../../../../mocks/goals.testing';
import { AppError, FieldError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import type { Goal } from '../models/goal.model';
import { GoalFormComponent } from './goal-form.component';

const triathlon: Goal = {
  id: 'goal-triathlon',
  title: 'Triathlon de Paris',
  type: 'evenement',
  targetDate: '2026-12-06',
  eventFormat: 'olympique',
  targetTime: { hours: 2, minutes: 30, seconds: 0 },
};

const volume: Goal = {
  id: 'goal-volume',
  title: 'Volume hebdomadaire',
  type: 'volume',
  targetDate: null,
  eventFormat: null,
  targetTime: null,
};

interface FormInputs {
  goal?: Goal | null;
  serverError?: AppError | null;
  submitting?: boolean;
}

async function renderForm(inputs: FormInputs = {}) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  await render(GoalFormComponent, {
    inputs: { goal: triathlon, ...inputs },
    on: { saved, cancelled },
    providers: goalsTestProviders(),
  });
  return { saved, cancelled };
}

function serverErrorWith(fieldErrors: FieldError[]): AppError {
  return new AppError({
    code: 'VALIDATION_FAILED',
    status: 400,
    userMessage: ERROR_MESSAGES['VALIDATION_FAILED'],
    fieldErrors,
  });
}

describe('GoalFormComponent', () => {
  it('affiche un formulaire vierge quand il sert à créer un objectif', async () => {
    await renderForm({ goal: null });

    expect(screen.getByRole('textbox', { name: 'Titre' })).toHaveDisplayValue('');
  });

  it('pré-remplit le titre et le temps cible de l objectif modifié', async () => {
    await renderForm();

    expect(screen.getByRole('textbox', { name: 'Titre' })).toHaveDisplayValue('Triathlon de Paris');
    expect(screen.getByLabelText('Heures')).toHaveDisplayValue('2');
    expect(screen.getByLabelText('Minutes')).toHaveDisplayValue('30');
    expect(screen.getByLabelText('Secondes')).toHaveDisplayValue('0');
  });

  it('affiche le format seulement quand le type est un événement', async () => {
    await renderForm({ goal: volume });

    expect(screen.queryByLabelText('Format')).not.toBeInTheDocument();
  });

  it('affiche le format quand le type passe de volume à événement', async () => {
    await renderForm({ goal: volume });

    await userEvent.click(screen.getByRole('combobox', { name: 'Type' }));
    await userEvent.click(await screen.findByText('Événement'));

    expect(await screen.findByLabelText('Format')).toBeInTheDocument();
  });

  it('émet la saisie complète à l enregistrement sans modification', async () => {
    const { saved } = await renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Triathlon de Paris',
        type: 'evenement',
        targetDate: '2026-12-06',
        eventFormat: 'olympique',
        targetTime: expect.objectContaining({ hours: 2, minutes: 30 }),
      }),
    );
  });

  it('émet la date au format YYYY-MM-DD sans décalage de fuseau', async () => {
    const { saved } = await renderForm({ goal: { ...triathlon, targetDate: '2027-01-01' } });

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith(expect.objectContaining({ targetDate: '2027-01-01' }));
  });

  it('émet le temps cible saisi en heures, minutes et secondes numériques', async () => {
    const { saved } = await renderForm();

    const hours = screen.getByLabelText('Heures');
    await userEvent.clear(hours);
    await userEvent.type(hours, '1');
    const minutes = screen.getByLabelText('Minutes');
    await userEvent.clear(minutes);
    await userEvent.type(minutes, '5');
    const seconds = screen.getByLabelText('Secondes');
    await userEvent.clear(seconds);
    await userEvent.type(seconds, '9');

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({ targetTime: { hours: 1, minutes: 5, seconds: 9 } }),
    );
  });

  it('n émet pas de saisie tant que le titre est vide', async () => {
    const { saved } = await renderForm();

    const title = screen.getByRole('textbox', { name: 'Titre' });
    await userEvent.clear(title);
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).not.toHaveBeenCalled();
  });

  it('limite le titre à 200 caractères', async () => {
    await renderForm();

    const title = screen.getByRole('textbox', { name: 'Titre' });
    await userEvent.clear(title);
    await userEvent.type(title, 'a'.repeat(201));

    expect(title).toHaveDisplayValue('a'.repeat(200));
  });

  it('émet cancelled quand l utilisateur annule la saisie', async () => {
    const { saved, cancelled } = await renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(cancelled).toHaveBeenCalledTimes(1);
    expect(saved).not.toHaveBeenCalled();
  });

  it('désactive l enregistrement pendant la soumission', async () => {
    await renderForm({ submitting: true });

    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });

  it('rattache à son champ une erreur serveur de temps cible', async () => {
    await renderForm({
      serverError: serverErrorWith([
        { field: 'targetTimeSeconds', message: 'Le temps cible doit être positif.' },
      ]),
    });

    expect(await screen.findByText('Le temps cible doit être positif.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('rattache à son champ une erreur serveur de date', async () => {
    await renderForm({
      serverError: serverErrorWith([{ field: 'targetDate', message: 'La date est invalide.' }]),
    });

    expect(await screen.findByText('La date est invalide.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('affiche dans une alerte les erreurs dont le champ n existe pas dans le formulaire', async () => {
    await renderForm({
      serverError: serverErrorWith([{ field: 'champInconnu', message: 'Erreur sans champ.' }]),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Erreur sans champ.');
  });

  it('affiche dans une alerte le message de GOAL_INVALID quand l erreur n a pas de détail par champ', async () => {
    await renderForm({
      serverError: new AppError({
        code: 'GOAL_INVALID',
        status: 400,
        userMessage: ERROR_MESSAGES['GOAL_INVALID'],
      }),
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(ERROR_MESSAGES['GOAL_INVALID']);
  });

  it('n affiche aucune alerte quand il n y a pas d erreur serveur', async () => {
    await renderForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
