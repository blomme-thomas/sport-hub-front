import { fireEvent, render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { sessionsTestProviders } from '../../../../../mocks/sessions.testing';
import { SessionModulesComponent } from './session-modules.component';
import type { EditableModule } from '../../models/session.model';

const modules: EditableModule[] = [
  {
    key: 1,
    type: 'echauffement',
    durationMinutes: 10,
    instruction: 'Footing souple',
    targetZones: null,
    perceivedEffort: null,
  },
  {
    key: 2,
    type: 'series',
    durationMinutes: 25,
    instruction: '4 x 400 m',
    targetZones: { heartRate: { min: 160, max: 170 }, pace: { min: 290, max: 310 } },
    perceivedEffort: 7,
  },
];

async function renderList(
  inputs: { readOnly?: boolean; invalidKeys?: Set<number> } = {},
  modulesInput: EditableModule[] = modules,
) {
  const outputs = {
    typeChanged: vi.fn(),
    durationChanged: vi.fn(),
    instructionChanged: vi.fn(),
    reordered: vi.fn(),
    removed: vi.fn(),
  };
  await render(SessionModulesComponent, {
    inputs: { modules: modulesInput, ...inputs },
    on: outputs,
    providers: sessionsTestProviders(),
  });
  return outputs;
}

describe('SessionModulesComponent', () => {
  it('affiche les modules dans l’ordre, avec zones cibles et effort visé', async () => {
    await renderList({ readOnly: true });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent('Séries');
    expect(items[1]).toHaveTextContent('Zones cibles : FC 160–170 · Allure 290–310');
    expect(items[1]).toHaveTextContent('Effort visé : 7/10');
  });

  it('n’affiche aucun champ en lecture seule', async () => {
    await renderList({ readOnly: true });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer le module 1' })).not.toBeInTheDocument();
  });

  it('émet la nouvelle durée saisie', async () => {
    const { durationChanged } = await renderList();

    fireEvent.input(screen.getByLabelText('Durée (min)', { selector: '#module-duration-2' }), {
      target: { value: '30' },
    });

    expect(durationChanged).toHaveBeenLastCalledWith({ key: 2, minutes: 30 });
  });

  it('émet la consigne modifiée', async () => {
    const { instructionChanged } = await renderList();

    fireEvent.input(screen.getByLabelText('Consigne', { selector: '#module-instruction-1' }), {
      target: { value: 'Footing lent' },
    });

    expect(instructionChanged).toHaveBeenLastCalledWith({ key: 1, instruction: 'Footing lent' });
  });

  it('émet le type choisi', async () => {
    const user = userEvent.setup();
    const { typeChanged } = await renderList();

    await user.selectOptions(
      screen.getByLabelText('Type', { selector: '#module-type-1' }),
      'educatifs',
    );

    expect(typeChanged).toHaveBeenCalledWith({ key: 1, type: 'educatifs' });
  });

  it('déplace un module par glisser-déposer depuis sa poignée', async () => {
    const { reordered } = await renderList();
    const items = screen.getByRole('list', { name: 'Modules de la séance' }).querySelectorAll('li');
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };

    fireEvent.pointerDown(items[0]?.querySelector('.module__handle') as Element);
    fireEvent.dragStart(items[0] as Element, { dataTransfer });
    fireEvent.dragOver(items[1] as Element, { dataTransfer });
    fireEvent.drop(items[1] as Element, { dataTransfer });

    expect(reordered).toHaveBeenCalledWith({ key: 1, toIndex: 1 });
  });

  it('n’autorise le glisser que depuis la poignée', async () => {
    const { reordered } = await renderList();
    const items = screen.getByRole('list', { name: 'Modules de la séance' }).querySelectorAll('li');
    const dataTransfer = { setData: vi.fn(), effectAllowed: '', dropEffect: '' };

    fireEvent.dragStart(items[0] as Element, { dataTransfer });
    fireEvent.drop(items[1] as Element, { dataTransfer });

    expect(reordered).not.toHaveBeenCalled();
  });

  it('émet la suppression demandée', async () => {
    const user = userEvent.setup();
    const { removed } = await renderList();

    await user.click(screen.getByRole('button', { name: 'Supprimer le module 2' }));

    expect(removed).toHaveBeenCalledWith(2);
  });

  it('signale un module invalide', async () => {
    await renderList({ invalidKeys: new Set([2]) });

    expect(screen.getByRole('alert')).toHaveTextContent('entre 1 et 1440 minutes');
  });

  it('indique l’absence de module', async () => {
    await renderList({}, []);

    expect(screen.getByText('Aucun module pour cette séance.')).toBeInTheDocument();
  });
});
