import { describe, expect, it } from 'vitest';
import { disciplineStyleOf } from './discipline-style';

describe('disciplineStyleOf', () => {
  it('donne un pictogramme et une couleur distincts aux disciplines connues', () => {
    expect(disciplineStyleOf('running').icon).toBe('run');
    expect(disciplineStyleOf('cycling').icon).toBe('bike');
    expect(disciplineStyleOf('running').color).not.toBe(disciplineStyleOf('cycling').color);
  });

  it('donne un style neutre à une discipline absente de la correspondance', () => {
    expect(disciplineStyleOf('golf')).toEqual({ icon: 'list', color: 'var(--sh-text-muted)' });
  });
});

describe('disciplineStyleOf — familles de sport', () => {
  it('donne le pictogramme vélo à toutes les variantes de vélo, y compris indoor et virtuel', () => {
    for (const key of ['indoor_cycling', 'virtual_ride', 'road_biking', 'gravel_cycling']) {
      expect(disciplineStyleOf(key)).toEqual(disciplineStyleOf('cycling'));
    }
  });

  it('donne le même style aux variantes de course et de natation', () => {
    expect(disciplineStyleOf('trail_running')).toEqual(disciplineStyleOf('running'));
    expect(disciplineStyleOf('open_water_swimming')).toEqual(disciplineStyleOf('lap_swimming'));
  });
});
