import { describe, expect, it } from 'vitest';
import { visibleDisplayName } from './profile.state';

describe('visibleDisplayName', () => {
  it('garde un prénom lisible', () => {
    expect(visibleDisplayName('Thomas')).toBe('Thomas');
  });

  it('ne renvoie jamais un identifiant technique à la place du nom', () => {
    expect(visibleDisplayName('605f67d9-0dc4-41be-846a-454010cdc9e9')).toBeNull();
  });

  it('renvoie null sans valeur', () => {
    expect(visibleDisplayName(null)).toBeNull();
  });
});
