import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import { SessionFormComponent, type DisciplineOption } from './session-form.component';

const DISCIPLINES: DisciplineOption[] = [{ typeKey: 'running', label: 'Course à pied' }];
const DEFAULTS = { date: '2026-11-12', startTime: '18:00' };

async function renderForm(
  disciplines: DisciplineOption[] = DISCIPLINES,
  serverError: AppError | null = null,
) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  await render(SessionFormComponent, {
    inputs: { defaults: DEFAULTS, disciplines, serverError },
    on: { saved, cancelled },
  });
  return { saved, cancelled };
}

describe('SessionFormComponent', () => {
  it('pré-remplit la date et l’heure de la case cliquée', async () => {
    await renderForm();

    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-12');
    expect(screen.getByLabelText('Heure de début')).toHaveValue('18:00');
  });

  it('émet le corps de création avec la discipline, la durée et la récurrence choisies', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    await user.selectOptions(screen.getByLabelText('Discipline'), 'running');
    await user.clear(screen.getByLabelText('Durée (min)'));
    await user.type(screen.getByLabelText('Durée (min)'), '45');
    await user.selectOptions(screen.getByLabelText('Récurrence'), 'hebdomadaire');
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).toHaveBeenCalledWith({
      date: '2026-11-12',
      startTime: '18:00',
      disciplineTypeKey: 'running',
      durationMinutes: 45,
      recurrence: 'hebdomadaire',
    });
  });

  it('n’émet rien sans discipline', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).not.toHaveBeenCalled();
  });

  it('explique qu’aucune discipline n’est disponible et bloque la création', async () => {
    await renderForm([]);

    expect(screen.getByText(/Aucune discipline dans le référentiel/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Créer la séance' })).toBeDisabled();
  });

  it('affiche l’erreur renvoyée par le back', async () => {
    await renderForm(
      DISCIPLINES,
      new AppError({
        code: 'SESSION_DISCIPLINE_UNKNOWN',
        status: 400,
        userMessage: ERROR_MESSAGES['SESSION_DISCIPLINE_UNKNOWN'],
      }),
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La discipline de la séance n’existe pas dans le référentiel.',
    );
  });
});
