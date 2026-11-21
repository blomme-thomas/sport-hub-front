import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { PlanSeanceModule } from '../../plan-seances/plan-seances.model';
import { PlanModulesEditorComponent } from './plan-modules-editor.component';

const MODULES: PlanSeanceModule[] = [
  {
    type: 'echauffement',
    durationMinutes: 10,
    instruction: 'Footing',
    targetZones: null,
    perceivedEffort: null,
  },
  {
    type: 'series',
    durationMinutes: 30,
    instruction: '4 x 400 m',
    targetZones: null,
    perceivedEffort: 7,
  },
];

async function renderEditor(modules: PlanSeanceModule[] = MODULES) {
  const modulesChange = vi.fn();
  await render(PlanModulesEditorComponent, {
    inputs: { modules },
    on: { modulesChange },
  });
  return { modulesChange };
}

describe('PlanModulesEditorComponent', () => {
  it('affiche le nombre de modules et leur durée totale', async () => {
    await renderEditor();

    expect(screen.getByRole('heading', { name: 'Modules (2) · 40 min' })).toBeInTheDocument();
    expect(screen.getByLabelText('Consigne', { selector: '#module-instruction-1' })).toHaveValue(
      '4 x 400 m',
    );
  });

  it('émet la liste complète avec la durée modifiée', async () => {
    const user = userEvent.setup();
    const { modulesChange } = await renderEditor();

    const duration = screen.getByLabelText('Durée du module 1 (min)');
    await user.clear(duration);
    await user.type(duration, '15');
    await user.tab();

    expect(modulesChange).toHaveBeenLastCalledWith([
      { ...MODULES[0], durationMinutes: 15 },
      MODULES[1],
    ]);
  });

  it('émet la liste sans le module supprimé', async () => {
    const user = userEvent.setup();
    const { modulesChange } = await renderEditor();

    await user.click(screen.getByRole('button', { name: 'Supprimer le module 1' }));

    expect(modulesChange).toHaveBeenCalledWith([MODULES[1]]);
  });

  it('signale un module hors bornes sans bloquer le formulaire parent', async () => {
    await renderEditor([{ ...MODULES[0], durationMinutes: 0 }]);

    expect(screen.getByRole('alert')).toHaveTextContent('Durée de 1 à 1440 minutes');
  });
});
