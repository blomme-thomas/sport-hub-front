import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Session } from '../../models/session.model';
import {
  SessionEditFormComponent,
  type SessionDisciplineOption,
} from './session-edit-form.component';

const DISCIPLINES: SessionDisciplineOption[] = [
  { typeKey: 'course_a_pied', label: 'Course à pied' },
];

const SESSION: Session = {
  id: 'session-1',
  date: '2026-11-12',
  disciplineTypeKey: 'course_a_pied',
  disciplineLabel: 'Course à pied',
  durationMinutes: 45,
  startTime: '18:00',
  recurrence: 'aucune',
  status: 'planifiee',
  modifiedManually: false,
  description: 'Fond',
  title: null,
  modules: [],
  objectives: { distanceMeters: null, zonePercentages: null },
  achievement: null,
  linkedActivity: null,
  nutrition: { carbsGrams: 60, carbsUnit: 'par_heure', hydrationMilliliters: 750 },
};

async function renderEdit(session: Session = SESSION) {
  const saved = vi.fn();
  await render(SessionEditFormComponent, {
    inputs: { session, disciplines: DISCIPLINES, saving: false, serverError: null },
    on: { saved, cancelled: vi.fn() },
  });
  return { saved, user: userEvent.setup() };
}

describe('SessionEditFormComponent : glucides et hydratation', () => {
  it('pré-remplit la nutrition enregistrée de la séance', async () => {
    await renderEdit();

    expect(screen.getByLabelText('Glucides (g)')).toHaveValue(60);
    expect(screen.getByLabelText('Unité des glucides')).toHaveDisplayValue('Par heure');
    expect(screen.getByLabelText('Hydratation (ml)')).toHaveValue(750);
  });

  it('envoie les valeurs de nutrition dans les détails de la séance', async () => {
    const { saved, user } = await renderEdit();

    await user.clear(screen.getByLabelText('Glucides (g)'));
    await user.type(screen.getByLabelText('Glucides (g)'), '90');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({
          carbsGrams: 90,
          carbsUnit: 'par_heure',
          hydrationMilliliters: 750,
        }),
      }),
    );
  });

  it('efface une valeur vidée en l’envoyant à null', async () => {
    const { saved, user } = await renderEdit();

    await user.clear(screen.getByLabelText('Hydratation (ml)'));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        details: expect.objectContaining({ hydrationMilliliters: null }),
      }),
    );
  });

  it('bloque l’enregistrement quand les glucides n’ont plus d’unité', async () => {
    const { saved, user } = await renderEdit();

    await user.selectOptions(screen.getByLabelText('Unité des glucides'), 'Non renseignée');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('Renseignez les glucides et leur unité ensemble.')).toBeInTheDocument();
  });
});
