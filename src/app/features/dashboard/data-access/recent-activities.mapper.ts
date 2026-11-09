import type { ActivitySummaryApi } from '../models/recent-activity.api-model';
import type { RecentActivity } from '../models/recent-activity.model';

const ABSENT = '—';
const MILLISECONDS_PER_DAY = 86_400_000;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;
const METERS_PER_KILOMETER = 1000;

const TYPE_LABELS: Record<string, string> = {
  running: 'Course à pied',
  cycling: 'Cyclisme',
  lap_swimming: 'Natation',
  virtual_ride: 'Vélo virtuel',
  walking: 'Marche',
};

const TYPE_ICONS: Record<string, string> = {
  running: '🏃',
  cycling: '🚴',
  lap_swimming: '🏊',
  virtual_ride: '🚴',
  walking: '🚶',
};

const DEFAULT_TYPE_ICON = '🏅';

/** Convertit une activité de l'API en séance d'affichage, relative à `now`. */
export function toRecentActivity(item: ActivitySummaryApi, now: Date): RecentActivity {
  const startedAt = new Date(item.startedAt);
  return {
    id: item.id,
    typeLabel: TYPE_LABELS[item.type] ?? item.type.replaceAll('_', ' '),
    typeIcon: TYPE_ICONS[item.type] ?? DEFAULT_TYPE_ICON,
    dateLabel: toRelativeDateLabel(startedAt, now),
    durationLabel: formatDuration(item.durationSeconds),
    distanceLabel: formatDistance(item.distanceMeters),
    heartRateLabel: formatHeartRate(item.averageHeartRate),
  };
}

/** « 45 min » sous une heure, sinon « 1h 05 » (heure et minutes sur deux chiffres). */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return hours === 0 ? `${minutes} min` : `${hours}h ${String(minutes).padStart(2, '0')}`;
}

/** « 142 bpm », ou « — » si la fréquence cardiaque moyenne est absente ou nulle. */
export function formatHeartRate(bpm: number | null): string {
  // Zéro : aucune mesure de FC (par exemple un vélo virtuel), donc absente.
  return bpm === null || bpm <= 0 ? ABSENT : `${Math.round(bpm)} bpm`;
}

/** « 7,8 km », ou « — » si la distance est absente. */
export function formatDistance(distanceMeters: number | null): string {
  if (distanceMeters === null) {
    return ABSENT;
  }
  const kilometers = distanceMeters / METERS_PER_KILOMETER;
  return `${new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(kilometers)} km`;
}

/** Libellé relatif au jour calendaire local : aujourd'hui, hier, jour de la semaine (moins de 7 jours), sinon date. */
export function toRelativeDateLabel(date: Date, now: Date): string {
  const days = Math.round((startOfLocalDay(now) - startOfLocalDay(date)) / MILLISECONDS_PER_DAY);
  if (days === 0) {
    return "Aujourd'hui";
  }
  if (days === 1) {
    return 'Hier';
  }
  if (days > 1 && days < 7) {
    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}
