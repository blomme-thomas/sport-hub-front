import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../../core/http/app-error';
import { ERROR_MESSAGES } from '../../../../core/http/error-messages';
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

async function fillZones(user: ReturnType<typeof userEvent.setup>, values: number[]) {
  const labels = ['Z1 (%)', 'Z2 (%)', 'Z3 (%)', 'Z4 (%)', 'Z5 (%)'];
  for (const [index, label] of labels.entries()) {
    const input = screen.getByLabelText(label);
    await user.clear(input);
    await user.type(input, String(values[index]));
  }
}

describe('SessionFormComponent', () => {
  it('reprend la durée de la plage glissée sur la grille', async () => {
    await render(SessionFormComponent, {
      inputs: {
        defaults: { date: '2026-11-12', startTime: '09:00', endTime: '10:15' },
        disciplines: DISCIPLINES,
      },
      on: { saved: vi.fn(), cancelled: vi.fn() },
    });

    expect(screen.getByLabelText('Durée (min)')).toHaveValue(75);
  });

  it('pré-remplit la date et l’heure de la case cliquée', async () => {
    await renderForm();

    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-12');
    expect(screen.getByLabelText('Heure de début')).toHaveValue('18:00');
  });

  it('émet le corps de création avec la discipline, la durée, la récurrence et les objectifs', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    await user.selectOptions(screen.getByLabelText('Discipline'), 'running');
    await user.clear(screen.getByLabelText('Durée (min)'));
    await user.type(screen.getByLabelText('Durée (min)'), '45');
    await user.selectOptions(screen.getByLabelText('Récurrence'), 'hebdomadaire');
    await user.type(screen.getByLabelText('Distance cible (km)'), '8');
    await fillZones(user, [10, 20, 40, 20, 10]);
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).toHaveBeenCalledWith({
      date: '2026-11-12',
      startTime: '18:00',
      disciplineTypeKey: 'running',
      durationMinutes: 45,
      recurrence: 'hebdomadaire',
      targetDistanceMeters: 8000,
      targetHrZonePercentages: [10, 20, 40, 20, 10],
    });
  });

  it('bloque la création tant que la répartition par zone ne totalise pas 100 %', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    await user.selectOptions(screen.getByLabelText('Discipline'), 'running');
    await fillZones(user, [10, 20, 40, 20, 5]);
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).not.toHaveBeenCalled();
    expect(screen.getByText('Total des zones : 95 %')).toBeInTheDocument();
    expect(screen.getByText(/totaliser 100 % \(actuellement 95 %\)/)).toBeInTheDocument();
  });

  it('n’affiche pas d’erreur d’objectif avant la première tentative de création', async () => {
    await renderForm();

    expect(screen.queryByText(/totaliser 100 %/)).not.toBeInTheDocument();
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

describe('SessionFormComponent – fichier plan-seances', () => {
  const PLAN = JSON.stringify({
    kind: 'plan-seances',
    schemaVersion: 1,
    importId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
    seances: [
      {
        date: '2026-11-25',
        disciplineTypeKey: 'running',
        durationMinutes: 50,
        description: 'Seuil',
        modules: [
          {
            type: 'series',
            durationMinutes: 20,
            instruction: '3 x 1000 m',
            targetZones: null,
            perceivedEffort: 8,
          },
        ],
      },
    ],
  });

  async function pastePlan(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.click(screen.getByLabelText('Ou collez le contenu JSON'));
    await user.paste(text);
  }

  it('pré-remplit les champs présents sans toucher aux autres', async () => {
    const user = userEvent.setup();
    await renderForm();

    await pastePlan(user, PLAN);

    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-25');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue(50);
    expect(screen.getByLabelText('Discipline')).toHaveValue('running');
    expect(screen.getByLabelText('Description de la séance')).toHaveValue('Seuil');
    expect(screen.getByLabelText('Heure de début')).toHaveValue('18:00');
    expect(screen.getByLabelText('Récurrence')).toHaveValue('aucune');
  });

  it('crée la séance avec les modules du fichier', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();

    await pastePlan(user, PLAN);
    await fillZones(user, [10, 20, 40, 20, 10]);
    await user.click(screen.getByRole('button', { name: 'Créer la séance' }));

    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        date: '2026-11-25',
        durationMinutes: 50,
        disciplineTypeKey: 'running',
        modules: [
          {
            type: 'series',
            durationMinutes: 20,
            instruction: '3 x 1000 m',
            targetZones: null,
            perceivedEffort: 8,
          },
        ],
      }),
    );
  });

  it('affiche le chemin de chaque erreur et ne modifie pas le formulaire', async () => {
    const user = userEvent.setup();
    const { saved } = await renderForm();
    const invalid = JSON.parse(PLAN);
    invalid.seances[0].modules[0].durationMinutes = 0;

    await pastePlan(user, JSON.stringify(invalid));

    expect(screen.getByRole('alert')).toHaveTextContent('seances[0].modules[0].durationMinutes');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue(60);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-12');
    expect(saved).not.toHaveBeenCalled();
  });

  it('refuse un fichier de plusieurs séances et renvoie vers l’import multiple', async () => {
    const user = userEvent.setup();
    await renderForm();
    const parsed = JSON.parse(PLAN);
    parsed.seances.push(parsed.seances[0]);

    await pastePlan(user, JSON.stringify(parsed));

    expect(screen.getByRole('alert')).toHaveTextContent('Importer des séances');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue(60);
  });
});
