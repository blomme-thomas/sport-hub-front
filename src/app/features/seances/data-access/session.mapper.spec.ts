import { describe, expect, it } from 'vitest';
import {
  sessionApi,
  seriesApi,
  echauffementApi,
  retourApi,
} from '../../../../mocks/fixtures/sessions.fixtures';
import type { EditableModule, SessionModule } from '../models/session.model';
import {
  isDirty,
  toEditable,
  toReplaceRequest,
  toSession,
  toSessionModule,
} from './session.mapper';

const savedModules: SessionModule[] = [echauffementApi, seriesApi, retourApi].map(toSessionModule);

function keyed(modules: SessionModule[]): EditableModule[] {
  let key = 0;
  return toEditable(modules, () => ++key);
}

describe('session.mapper', () => {
  it('traduit la clé de discipline en libellé, ou garde la clé si elle est inconnue', () => {
    const known = toSession(sessionApi, () => 'Course à pied');
    const unknown = toSession(sessionApi, (key) => key);

    expect(known.disciplineLabel).toBe('Course à pied');
    expect(unknown.disciplineLabel).toBe('course_a_pied');
  });

  it('garde les modules dans leur ordre avec leur position', () => {
    const session = toSession(sessionApi, (key) => key);

    expect(session.modules.map((module) => module.position)).toEqual([1, 2, 3]);
    expect(session.modules[1]).toMatchObject({
      type: 'series',
      durationMinutes: 25,
      perceivedEffort: 7,
    });
  });

  it('envoie le brouillon sans clés locales ni positions, consigne rognée', () => {
    const draft = keyed(savedModules).map((module, index) =>
      index === 0 ? { ...module, instruction: '  Footing souple  ' } : module,
    );

    const body = toReplaceRequest(draft);

    expect(body.modules[0]).toEqual({
      type: 'echauffement',
      durationMinutes: 10,
      instruction: 'Footing souple',
      targetZones: null,
      perceivedEffort: null,
    });
    expect(body.modules[1]).not.toHaveProperty('position');
    expect(body.modules[1]).not.toHaveProperty('key');
    expect(body.modules[1]?.targetZones).toEqual({ heartRate: { min: 160, max: 170 } });
  });

  describe('isDirty', () => {
    it('ne signale aucune modification quand le brouillon reprend la séance', () => {
      expect(isDirty(keyed(savedModules), savedModules)).toBe(false);
    });

    it('signale une durée modifiée', () => {
      const draft = keyed(savedModules).map((module, index) =>
        index === 1 ? { ...module, durationMinutes: 30 } : module,
      );

      expect(isDirty(draft, savedModules)).toBe(true);
    });

    it('signale un ordre modifié', () => {
      const [first, second, third] = keyed(savedModules);
      const reordered = [second, first, third].filter(
        (module): module is EditableModule => module !== undefined,
      );

      expect(isDirty(reordered, savedModules)).toBe(true);
    });

    it('signale un module ajouté ou supprimé', () => {
      expect(isDirty(keyed(savedModules).slice(1), savedModules)).toBe(true);
    });

    it('ignore les espaces autour de la consigne', () => {
      const draft = keyed(savedModules).map((module, index) =>
        index === 0 ? { ...module, instruction: `${module.instruction} ` } : module,
      );

      expect(isDirty(draft, savedModules)).toBe(false);
    });
  });
});
