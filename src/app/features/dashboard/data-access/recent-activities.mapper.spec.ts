import { describe, expect, it } from 'vitest';
import type { ActivitySummaryApi } from '../models/recent-activity.api-model';
import {
  formatDistance,
  formatDuration,
  toRecentActivity,
  toRelativeDateLabel,
} from './recent-activities.mapper';

// Référence : samedi 7 novembre 2026, midi, heure locale.
const NOW = new Date(2026, 10, 7, 12);

describe('formatDuration', () => {
  it('affiche les minutes seules sous une heure', () => {
    expect(formatDuration(2700)).toBe('45 min');
  });

  it('affiche heures et minutes à partir d une heure', () => {
    expect(formatDuration(4800)).toBe('1h 20');
    expect(formatDuration(3600)).toBe('1h 00');
  });
});

describe('formatDistance', () => {
  it('affiche la distance en kilomètres à une décimale, séparateur français', () => {
    expect(formatDistance(7800)).toBe('7,8 km');
    expect(formatDistance(32500)).toBe('32,5 km');
  });

  it('affiche un tiret quand la distance est absente', () => {
    expect(formatDistance(null)).toBe('—');
  });
});

describe('toRelativeDateLabel', () => {
  it('nomme le jour même, la veille, puis le jour de la semaine sous sept jours', () => {
    expect(toRelativeDateLabel(new Date(2026, 10, 7, 6, 30), NOW)).toBe("Aujourd'hui");
    expect(toRelativeDateLabel(new Date(2026, 10, 6, 23, 59), NOW)).toBe('Hier');
    expect(toRelativeDateLabel(new Date(2026, 10, 4, 8, 0), NOW)).toBe('Mercredi');
  });

  it('affiche la date au-delà de sept jours', () => {
    expect(toRelativeDateLabel(new Date(2026, 9, 30, 17, 15), NOW)).toBe('30 octobre');
  });
});

describe('toRecentActivity', () => {
  it('traduit le type Garmin et formate les valeurs', () => {
    const item: ActivitySummaryApi = {
      id: 'act-1',
      garminActivityId: '1',
      type: 'lap_swimming',
      startedAt: new Date(2026, 10, 7, 9, 0).toISOString(),
      durationSeconds: 3600,
      distanceMeters: null,
      averageHeartRate: 142,
    };

    expect(toRecentActivity(item, NOW)).toEqual({
      id: 'act-1',
      typeLabel: 'Natation',
      typeIcon: '🏊',
      dateLabel: "Aujourd'hui",
      durationLabel: '1h 00',
      heartRateLabel: '142 bpm',
      distanceLabel: '—',
    });
  });

  it('traduit le vélo virtuel en cyclisme pictogrammé', () => {
    const item: ActivitySummaryApi = {
      id: 'act-3',
      garminActivityId: '3',
      type: 'virtual_ride',
      startedAt: new Date(2026, 10, 7, 7, 0).toISOString(),
      durationSeconds: 2400,
      distanceMeters: 15000,
      averageHeartRate: 142,
    };

    const activity = toRecentActivity(item, NOW);
    expect(activity.typeLabel).toBe('Vélo virtuel');
    expect(activity.typeIcon).toBe('🚴');
  });

  it('garde le type inconnu lisible, sans underscore', () => {
    const item: ActivitySummaryApi = {
      id: 'act-2',
      garminActivityId: '2',
      type: 'trail_running',
      startedAt: new Date(2026, 10, 6, 9, 0).toISOString(),
      durationSeconds: 60,
      distanceMeters: 1000,
      averageHeartRate: 142,
    };

    expect(toRecentActivity(item, NOW).typeLabel).toBe('trail running');
    expect(toRecentActivity(item, NOW).typeIcon).toBe('🏅');
  });
});
