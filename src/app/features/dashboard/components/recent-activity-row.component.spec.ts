import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import type { RecentActivity } from '../models/recent-activity.model';
import { HeartRateZonesState } from '../data-access/heart-rate-zones.state';
import { RecentActivityRowComponent } from './recent-activity-row.component';

const course: RecentActivity = {
  id: 'act-1',
  typeLabel: 'Course à pied',
  typeIcon: '🏃',
  dateLabel: "Aujourd'hui",
  durationLabel: '1h 05',
  distanceLabel: '12,4 km',
  heartRateLabel: '152 bpm',
};

function renderRow(detail: object) {
  server.use(http.get('*/api/activities/:id', () => HttpResponse.json(detail)));
  return render(RecentActivityRowComponent, {
    inputs: { activity: course },
    on: { opened: vi.fn() },
    providers: [...statsTestProviders(), HeartRateZonesState],
  });
}

describe('RecentActivityRowComponent', () => {
  it('affiche le titre, le jour, la durée, la distance et la FC moyenne au-dessus de la courbe', async () => {
    await renderRow({
      id: 'act-1',
      heartRateSeries: [
        { occurredAt: '2026-11-09T07:00:00Z', bpm: 140 },
        { occurredAt: '2026-11-09T07:01:00Z', bpm: 152 },
        { occurredAt: '2026-11-09T07:02:00Z', bpm: 160 },
      ],
    });

    expect(screen.getByText('Course à pied')).toBeInTheDocument();
    expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
    expect(screen.getByText('1h 05 · 12,4 km')).toBeInTheDocument();
    expect(screen.getByText('152 bpm')).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: 'Fréquence cardiaque, Course à pied' }),
    ).toBeInTheDocument();
  });

  it('affiche un tiret à la place de la courbe quand la série de FC est absente', async () => {
    await renderRow({ id: 'act-1', heartRateSeries: null });

    expect(await screen.findByText('—', { selector: '.row__none' })).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /Fréquence cardiaque/ })).not.toBeInTheDocument();
  });

  it('émet l’identifiant de la séance au clic', async () => {
    const user = userEvent.setup();
    const opened = vi.fn();
    server.use(
      http.get('*/api/activities/:id', () =>
        HttpResponse.json({ id: 'act-1', heartRateSeries: null }),
      ),
    );
    await render(RecentActivityRowComponent, {
      inputs: { activity: course },
      on: { opened },
      providers: [...statsTestProviders(), HeartRateZonesState],
    });

    await user.click(screen.getByRole('button', { name: /Détail de la séance Course à pied/ }));

    expect(opened).toHaveBeenCalledWith('act-1');
  });
});
