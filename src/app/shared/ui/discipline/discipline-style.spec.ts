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
