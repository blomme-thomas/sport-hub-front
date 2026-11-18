import { TestBed } from '@angular/core/testing';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { statsTestProviders } from '../../../../mocks/training-stats.testing';
import { server } from '../../../../mocks/server';
import { DashboardState } from './dashboard.state';
import { RecentActivitiesApi } from './recent-activities.api';
import { WeekMiniCalendarState } from './week-mini-calendar.state';
import { WeekSessionsApi } from './week-sessions.api';

const DISCIPLINES = {
  items: [
    {
      typeKey: 'running',
      label: 'Course à pied',
      family: 'running',
      firstSeenAt: '',
      lastSeenAt: '',
    },
    {
      typeKey: 'indoor_cycling',
      label: 'Indoor cycling',
      family: 'cycling',
      firstSeenAt: '',
      lastSeenAt: '',
    },
    {
      typeKey: 'virtual_ride',
      label: 'Vélo virtuel',
      family: 'cycling',
      firstSeenAt: '',
      lastSeenAt: '',
    },
  ],
};

function activity(id: string, type: string) {
  return {
    id,
    garminActivityId: id,
    type,
    family: 'other' as const,
    startedAt: new Date(2026, 10, 11, 9).toISOString(),
    durationSeconds: 2700,
    distanceMeters: 10000,
    averageHeartRate: 140,
  };
}

function settle(assertion: () => void): Promise<void> {
  return vi.waitFor(() => {
    TestBed.tick();
    assertion();
  });
}

describe('WeekMiniCalendarState — légende', () => {
  it('annote la légende par famille : indoor cycling et vélo virtuel donnent une seule entrée « Vélo »', async () => {
    server.use(
      http.get('*/api/disciplines', () => HttpResponse.json(DISCIPLINES)),
      http.get('*/api/sessions', () => HttpResponse.json({ items: [] })),
      http.get('*/api/activities', () =>
        HttpResponse.json({
          items: [
            activity('a', 'indoor_cycling'),
            activity('b', 'virtual_ride'),
            activity('c', 'running'),
          ],
          page: 1,
          pageSize: 100,
          total: 3,
        }),
      ),
    );
    TestBed.configureTestingModule({
      providers: [
        ...statsTestProviders(),
        DashboardState,
        WeekSessionsApi,
        RecentActivitiesApi,
        WeekMiniCalendarState,
      ],
    });
    const state = TestBed.inject(WeekMiniCalendarState);

    await settle(() => expect(state.isLoading()).toBe(false));
    await settle(() => expect(state.legend().length).toBeGreaterThan(0));

    expect(state.legend()).toEqual([
      { typeKey: 'cycling', label: 'Vélo' },
      { typeKey: 'running', label: 'Course à pied' },
    ]);
  });
});
