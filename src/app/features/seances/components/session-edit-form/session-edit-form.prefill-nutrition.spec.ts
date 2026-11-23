import { render, screen } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { dropJsonFile, jsonFileDropZone } from '../../../../../mocks/json-file.testing';
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
  description: null,
  title: null,
  modules: [],
  objectives: { distanceMeters: null, zonePercentages: null },
  achievement: null,
  linkedActivity: null,
  nutrition: { carbsGrams: null, carbsUnit: null, hydrationMilliliters: null },
};

const PLAN_V2 = JSON.stringify({
  kind: 'plan-seances',
  schemaVersion: 2,
  seances: [
    {
      date: '2026-11-26',
      disciplineTypeKey: 'course_a_pied',
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
      carbsGrams: 90,
      carbsUnit: 'pour_la_seance',
      hydrationMilliliters: 1000,
    },
  ],
});

describe('SessionEditFormComponent : pré-remplissage JSON de la nutrition', () => {
  it('reporte la nutrition d’un fichier version 2 dans le formulaire', async () => {
    await render(SessionEditFormComponent, {
      inputs: { session: SESSION, disciplines: DISCIPLINES, saving: false, serverError: null },
      on: { saved: vi.fn(), cancelled: vi.fn() },
    });

    await dropJsonFile(jsonFileDropZone('Fichier de séance (.json)'), PLAN_V2);

    expect(screen.getByLabelText('Glucides (g)')).toHaveValue(90);
    expect(screen.getByLabelText('Unité des glucides')).toHaveDisplayValue('Pour la séance');
    expect(screen.getByLabelText('Hydratation (ml)')).toHaveValue(1000);
  });
});
