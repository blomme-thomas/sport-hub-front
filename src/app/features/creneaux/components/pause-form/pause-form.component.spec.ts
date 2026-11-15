import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PauseFormComponent } from './pause-form.component';

const draft = { startDate: '2026-12-20', endDate: '2026-12-27', reason: 'vacances' as const };

describe('PauseFormComponent', () => {
  it('émet la pause saisie quand la fin suit le début', async () => {
    const saved = vi.fn();
    await render(PauseFormComponent, {
      inputs: { draft },
      on: { saved, cancelled: vi.fn() },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(saved).toHaveBeenCalledWith({
      startDate: '2026-12-20',
      endDate: '2026-12-27',
      reason: 'vacances',
    });
  });

  it('signale une fin antérieure au début et n’émet rien', async () => {
    const saved = vi.fn();
    const { fixture } = await render(PauseFormComponent, {
      inputs: { draft: { ...draft, endDate: '2026-12-10' } },
      on: { saved, cancelled: vi.fn() },
    });
    fixture.detectChanges();

    expect(screen.getByRole('alert')).toHaveTextContent('ne peut pas précéder le début');
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(saved).not.toHaveBeenCalled();
  });
});
