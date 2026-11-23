import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SessionFormComponent, type DisciplineOption } from './session-form.component';

const DISCIPLINES: DisciplineOption[] = [{ typeKey: 'running', label: 'Course à pied' }];
const DEFAULTS = { date: '2026-11-12', startTime: '18:00' };

async function renderForm() {
  const saved = vi.fn();
  await render(SessionFormComponent, {
    inputs: { defaults: DEFAULTS, disciplines: DISCIPLINES, serverError: null },
    on: { saved, cancelled: vi.fn() },
  });
  return { saved, user: userEvent.setup() };
}

async function fillZones(user: ReturnType<typeof userEvent.setup>, values: number[]) {
  const labels = ['Z1 (%)', 'Z2 (%)', 'Z3 (%)', 'Z4 (%)', 'Z5 (%)'];
  for (const [index, label] of labels.entries()) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, String(values[index]));
  }
}

describe('SessionFormComponent : glucides et hydratation', () => {
  it('envoie la cible de glucides et l’hydratation quand elles sont renseignées', async () => {
    const { saved, user } = await renderForm();

    await user.selectOptions(screen.getByLabelText('Discipline'), 'running');
    await user.clear(screen.getByLabelText('Durée (min)'));
    await user.type(screen.getByLabelText('Durée (min)'), '90');
    await fillZones(user, [10, 20, 40, 20, 10]);
    await user.type(screen.getByLabelText('Glucides (g)'), '60');
    await user.selectOptions(screen.getByLabelText('Unité des glucides'), 'Par heure');
    await user.type(screen.getByLabelText('Hydratation (ml)'), '750');
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        carbsGrams: 60,
        carbsUnit: 'par_heure',
        hydrationMilliliters: 750,
      }),
    );
  });

  it('n’envoie aucun champ nutrition quand ils sont vides', async () => {
    const { saved, user } = await renderForm();

    await user.selectOptions(screen.getByLabelText('Discipline'), 'running');
    await fillZones(user, [10, 20, 40, 20, 10]);
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    const body = saved.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body).not.toHaveProperty('carbsGrams');
    expect(body).not.toHaveProperty('carbsUnit');
    expect(body).not.toHaveProperty('hydrationMilliliters');
  });

  it('bloque la création quand les glucides n’ont pas d’unité', async () => {
    const { saved, user } = await renderForm();

    await user.selectOptions(screen.getByLabelText('Discipline'), 'running');
    await fillZones(user, [10, 20, 40, 20, 10]);
    await user.type(screen.getByLabelText('Glucides (g)'), '60');
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('Renseignez les glucides et leur unité ensemble.')).toBeInTheDocument();
  });
});
