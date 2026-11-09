import { provideRouter } from '@angular/router';
import { HttpResponse, http } from 'msw';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../../../../mocks/server';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { AppError } from '../../../core/http/app-error';
import { DEFAULT_ERROR_MESSAGE } from '../../../core/http/error-messages';
import type { RecentActivity } from '../models/recent-activity.model';
import { RecentActivitiesCardComponent } from './recent-activities-card.component';

const course: RecentActivity = {
  id: 'act-4',
  typeLabel: 'Course à pied',
  typeIcon: '🏃',
  dateLabel: "Aujourd'hui",
  durationLabel: '45 min',
  distanceLabel: '7,8 km',
  heartRateLabel: '142 bpm',
};

const natation: RecentActivity = {
  id: 'act-2',
  typeLabel: 'Natation',
  typeIcon: '🏊',
  dateLabel: 'Lundi',
  durationLabel: '1h 0 min',
  distanceLabel: '—',
  heartRateLabel: '142 bpm',
};

function renderCard(inputs: Partial<Record<string, unknown>>, on?: Record<string, unknown>) {
  // Chaque ligne charge le détail de son activité pour tracer la courbe de FC.
  server.use(
    http.get('*/api/activities/:id', () =>
      HttpResponse.json({ id: 'act', heartRateSeries: null, hrTimeInZone: [] }),
    ),
  );
  return render(RecentActivitiesCardComponent, {
    inputs: { activities: undefined, ...inputs },
    on,
    providers: [provideRouter([]), ...statsTestProviders()],
  });
}

describe('RecentActivitiesCardComponent', () => {
  it('affiche les séances dans l ordre reçu, avec date, durée et distance', async () => {
    await renderCard({ activities: [course, natation] });

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Course à pied');
    expect(items[0]).toHaveTextContent("Aujourd'hui");
    expect(items[0]).toHaveTextContent('45 min');
    expect(items[0]).toHaveTextContent('7,8 km');
    expect(items[1]).toHaveTextContent('—');
  });

  it('signale le chargement tant que la liste n est pas reçue', async () => {
    const { container } = await renderCard({ activities: undefined, loading: true });

    expect(screen.getByText('Chargement…')).toBeInTheDocument();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('affiche un état vide explicite', async () => {
    await renderCard({ activities: [] });

    expect(screen.getByText('Aucune séance récente')).toBeInTheDocument();
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });

  it('affiche l erreur et émet retry au clic sur Réessayer', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    const error = new AppError({
      code: 'unknown',
      status: 500,
      userMessage: DEFAULT_ERROR_MESSAGE,
    });
    await renderCard({ activities: undefined, error }, { retry });

    expect(screen.getByRole('alert')).toHaveTextContent(error.userMessage);
    await user.click(screen.getByRole('button', { name: 'Réessayer' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
