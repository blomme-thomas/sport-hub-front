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
  { typeKey: 'velo', label: 'Vélo' },
];

const SESSION: Session = {
  id: 'session-1',
  date: '2026-11-12',
  disciplineTypeKey: 'course_a_pied',
  disciplineLabel: 'Course à pied',
  durationMinutes: 45,
  startTime: '18:00',
  status: 'planifiee',
  modifiedManually: false,
  description: 'Fond',
  title: null,
  modules: [],
  objectives: { distanceMeters: null, zonePercentages: null },
  achievement: null,
  linkedActivity: null,
};

const PLAN = JSON.stringify({
  kind: 'plan-seances',
  schemaVersion: 1,
  importId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  seances: [
    {
      date: '2026-11-26',
      disciplineTypeKey: 'velo',
      durationMinutes: 70,
      modules: [
        {
          type: 'educatifs',
          durationMinutes: 30,
          instruction: 'Cadence 100 rpm',
          targetZones: null,
          perceivedEffort: null,
        },
      ],
    },
  ],
});

async function renderEdit(session: Session = SESSION) {
  const saved = vi.fn();
  const cancelled = vi.fn();
  await render(SessionEditFormComponent, {
    inputs: { session, disciplines: DISCIPLINES, saving: false, serverError: null },
    on: { saved, cancelled },
  });
  return { saved, cancelled };
}

describe('SessionEditFormComponent', () => {
  it('pré-remplit le formulaire avec les valeurs actuelles de la séance', async () => {
    await renderEdit();

    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-12');
    expect(screen.getByLabelText('Heure de début')).toHaveValue('18:00');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue(45);
    expect(screen.getByLabelText('Discipline')).toHaveValue('course_a_pied');
    expect(screen.getByLabelText('Description')).toHaveValue('Fond');
  });

  it('émet les champs modifiés, sans modules, quand aucun fichier n’est importé', async () => {
    const user = userEvent.setup();
    const { saved } = await renderEdit();

    await user.clear(screen.getByLabelText('Durée (min)'));
    await user.type(screen.getByLabelText('Durée (min)'), '60');
    await user.clear(screen.getByLabelText('Description'));
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith({
      details: {
        date: '2026-11-12',
        startTime: '18:00',
        durationMinutes: 60,
        disciplineTypeKey: 'course_a_pied',
        description: null,
      },
      modules: null,
    });
  });

  it('pré-remplit depuis le fichier sans enregistrer, puis émet les modules', async () => {
    const user = userEvent.setup();
    const { saved } = await renderEdit();

    await user.click(screen.getByLabelText('Ou collez le contenu JSON'));
    await user.paste(PLAN);

    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-26');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue(70);
    expect(screen.getByLabelText('Discipline')).toHaveValue('velo');
    expect(screen.getByLabelText('Heure de début')).toHaveValue('18:00');
    expect(screen.getByLabelText('Description')).toHaveValue('Fond');
    expect(saved).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith({
      details: {
        date: '2026-11-26',
        startTime: '18:00',
        durationMinutes: 70,
        disciplineTypeKey: 'velo',
        description: 'Fond',
      },
      modules: [
        {
          type: 'educatifs',
          durationMinutes: 30,
          instruction: 'Cadence 100 rpm',
          targetZones: null,
          perceivedEffort: null,
        },
      ],
    });
  });

  it('affiche chaque erreur du fichier avec son chemin et ne modifie pas le formulaire', async () => {
    const user = userEvent.setup();
    const { saved } = await renderEdit();
    const invalid = JSON.parse(PLAN);
    invalid.seances[0].durationMinutes = 'soixante';

    await user.click(screen.getByLabelText('Ou collez le contenu JSON'));
    await user.paste(JSON.stringify(invalid));

    expect(screen.getByRole('alert')).toHaveTextContent('seances[0].durationMinutes');
    expect(screen.getByLabelText('Durée (min)')).toHaveValue(45);
    expect(screen.getByLabelText('Date')).toHaveValue('2026-11-12');
    expect(saved).not.toHaveBeenCalled();
  });

  it('garde la discipline de la séance même si elle ne figure plus au référentiel', async () => {
    await renderEdit({ ...SESSION, disciplineTypeKey: 'natation', disciplineLabel: 'natation' });

    expect(screen.getByRole('option', { name: 'natation' })).toBeInTheDocument();
  });
});
