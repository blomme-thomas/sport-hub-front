import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { slotsTestProviders } from '../../../../mocks/slots.testing';
import { AppError, FieldError } from '../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../core/http/error-messages';
import type { Slot } from '../models/slot.model';
import { SlotFormComponent } from './slot-form.component';

const DEFAULTS = { date: '2026-11-10', startTime: '09:00', endTime: '10:00' };

const weeklySlot: Slot = {
  id: 'slot-occupe-lundi',
  type: 'occupe',
  date: '2026-11-02',
  startTime: '18:00',
  endTime: '19:00',
  recurrence: 'hebdomadaire',
};

interface FormInputs {
  slot?: Slot | null;
  serverError?: AppError | null;
}

async function renderForm(inputs: FormInputs = {}) {
  const saved = vi.fn();
  const deleted = vi.fn();
  const cancelled = vi.fn();
  await render(SlotFormComponent, {
    inputs: { defaults: DEFAULTS, ...inputs },
    on: { saved, deleted, cancelled },
    providers: slotsTestProviders(),
  });
  return { saved, deleted, cancelled };
}

function serverErrorWith(fieldErrors: FieldError[]): AppError {
  return new AppError({
    code: 'VALIDATION_FAILED',
    status: 400,
    userMessage: ERROR_MESSAGES['VALIDATION_FAILED'],
    fieldErrors,
  });
}

describe('SlotFormComponent', () => {
  it('propose les valeurs par défaut pour une création', async () => {
    await renderForm();

    expect(screen.getByLabelText('Début')).toHaveValue('09:00');
    expect(screen.getByLabelText('Fin')).toHaveValue('10:00');
    expect(screen.queryByRole('button', { name: 'Supprimer' })).not.toBeInTheDocument();
  });

  it('pré-remplit un créneau existant et propose de le supprimer', async () => {
    await renderForm({ slot: weeklySlot });

    expect(screen.getByLabelText('Début')).toHaveValue('18:00');
    expect(screen.getByLabelText('Fin')).toHaveValue('19:00');
    expect(screen.getByRole('button', { name: 'Supprimer' })).toBeInTheDocument();
    expect(
      screen.getByText('Toute modification ou suppression vaut pour toute la série.'),
    ).toBeInTheDocument();
  });

  it('émet la saisie complète à l’enregistrement', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith({
      type: 'libre',
      date: '2026-11-10',
      startTime: '09:00',
      endTime: '10:00',
      recurrence: 'aucune',
    });
  });

  it('refuse une fin qui n’est pas postérieure au début, sans émettre', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    fireEvent.input(screen.getByLabelText('Fin'), { target: { value: '08:30' } });
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(
      screen.getByText('L’heure de fin doit être postérieure à l’heure de début.'),
    ).toBeInTheDocument();
    expect(saved).not.toHaveBeenCalled();
  });

  it('affiche sous le champ l’erreur de validation renvoyée par le back', async () => {
    await renderForm({
      serverError: serverErrorWith([{ field: 'date', message: 'Date inexistante.' }]),
    });

    expect(screen.getByText('Date inexistante.')).toBeInTheDocument();
  });

  it('affiche en alerte les erreurs sans champ, sans rattachement', async () => {
    await renderForm({
      serverError: new AppError({
        code: 'SLOT_END_NOT_AFTER_START',
        status: 400,
        userMessage: ERROR_MESSAGES['SLOT_END_NOT_AFTER_START'],
      }),
    });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'L’heure de fin doit être postérieure à l’heure de début.',
    );
  });

  it('demande la suppression sans la faire elle-même', async () => {
    const user = userEvent.setup();
    const { deleted } = await renderForm({ slot: weeklySlot });

    await user.click(screen.getByRole('button', { name: 'Supprimer' }));

    expect(deleted).toHaveBeenCalledOnce();
  });
});
