import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
} from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';
import { toAppError } from '../../../../core/http/problem-details.mapper';
import { HeartRateZonesState } from '../../data-access/heart-rate-zones.state';
import { RecentActivitiesApi } from '../../data-access/recent-activities.api';
import {
  formatDistance,
  formatDuration,
  formatHeartRate,
  toRecentActivity,
} from '../../data-access/recent-activities.mapper';
import type { ActivityDetailApi, HeartRateSampleApi } from '../../models/recent-activity.api-model';
import {
  detailChartOptions,
  hasDistanceAxis,
  heartRateChartData,
  type HeartRateAxis,
} from '../../config/heart-rate-chart.config';
import { fill, TEXTS } from '@shared/texts/texts';

/** Donnée transmise à la modale : identifiant de l'activité. */
export interface ActivityDetailModalData {
  id: string;
}

const SECONDS_PER_MINUTE = 60;
const METERS_PER_KILOMETER = 1000;

/** Une tuile d'indicateur de l'en-tête : libellé et valeur déjà formatée. */
export interface DetailKpi {
  label: string;
  value: string;
}

/**
 * Détail d'une activité réalisée, en quatre blocs : en-tête, indicateurs, courbe de FC à gauche,
 * détails, zones de FC et notes personnelles à droite. Lecture seule. Les données viennent de
 * `GET /api/activities/:id` ; une erreur reste affichée dans la modale.
 */
@Component({
  selector: 'sh-activity-detail-modal',
  imports: [ChartComponent],
  templateUrl: './activity-detail-modal.component.html',
  styleUrl: './activity-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailModalComponent {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  private readonly data = inject<ActivityDetailModalData>(NZ_MODAL_DATA);
  private readonly api = inject(RecentActivitiesApi);
  private readonly heartZones = inject(HeartRateZonesState);

  protected readonly detail = resource<ActivityDetailApi, string>({
    params: () => this.data.id,
    loader: ({ params }) => firstValueFrom(this.api.detail(params)),
  });

  /** Message utilisateur de l'erreur de chargement, `null` sinon. */
  protected readonly errorMessage = computed<string | null>(() => {
    const error = this.detail.error();
    return error === undefined ? null : toAppError(error).userMessage;
  });

  /** Libellé français du type d'activité, comme dans la liste (« Course à pied »). */
  protected readonly typeLabel = computed<string>(() =>
    this.detail.hasValue() ? toRecentActivity(this.detail.value(), new Date()).typeLabel : '',
  );

  /** Ligne sous le titre : la date de la séance. Distance, durée et allure sont dans les indicateurs. */
  protected readonly summary = computed<string>(() => {
    if (!this.detail.hasValue()) {
      return '';
    }
    return formatStart(this.detail.value().startedAt);
  });

  /** Indicateurs de l'en-tête, formatés. Une valeur absente s'affiche « — ». */
  protected readonly kpis = computed<DetailKpi[]>(() => {
    if (!this.detail.hasValue()) {
      return [];
    }
    const activity = this.detail.value();
    return [
      {
        label: TEXTS.dashboard.detail.distanceLabel,
        value: formatDistance(activity.distanceMeters),
      },
      { label: TEXTS.dashboard.detail.time, value: formatDuration(activity.durationSeconds) },
      {
        label: TEXTS.dashboard.detail.avgPace,
        value: paceLabel(activity.durationSeconds, activity.distanceMeters),
      },
      { label: TEXTS.dashboard.detail.calories, value: formatCalories(activity.calories) },
      {
        label: TEXTS.dashboard.detail.avgHeartRate,
        value: formatHeartRate(activity.averageHeartRate),
      },
    ];
  });

  /** Lignes du bloc « Détails de la séance », formatées. */
  protected readonly details = computed<{ label: string; value: string }[]>(() => {
    if (!this.detail.hasValue()) {
      return [];
    }
    const activity = this.detail.value();
    return [
      {
        label: TEXTS.dashboard.detail.typeLabel,
        value: toRecentActivity(activity, new Date()).typeLabel,
      },
      { label: 'Date', value: formatStart(activity.startedAt) },
      {
        label: TEXTS.dashboard.detail.elevation,
        value: formatMeters(activity.elevationGainMeters),
      },
      { label: TEXTS.dashboard.detail.maxHeartRate, value: formatHeartRate(activity.maxHeartRate) },
    ];
  });

  protected readonly samples = computed<readonly HeartRateSampleApi[]>(() =>
    this.detail.hasValue() ? (this.detail.value().heartRateSeries ?? []) : [],
  );

  /** Axe demandé par l'utilisateur ; reste sur la durée tant que les échantillons n'ont pas de distance. */
  protected readonly requestedAxis = signal<HeartRateAxis>('time');
  /** Bascule Durée / Km proposée seulement si chaque échantillon porte sa distance. */
  protected readonly canUseDistance = computed(() => hasDistanceAxis(this.samples()));
  protected readonly axis = computed<HeartRateAxis>(() =>
    this.requestedAxis() === 'distance' && this.canUseDistance() ? 'distance' : 'time',
  );

  protected readonly chartData = computed(() =>
    heartRateChartData(
      this.samples(),
      this.heartZones.floors(),
      this.detail.hasValue() ? this.detail.value().startedAt : new Date(0).toISOString(),
      this.axis(),
    ),
  );
  protected readonly chartOptions = computed(() => detailChartOptions(this.axis()));

  protected selectAxis(axis: HeartRateAxis): void {
    this.requestedAxis.set(axis);
  }

  /** Temps passé dans chaque zone de FC, avec sa part du total, pour les zones renseignées. */
  protected readonly zones = computed<{ label: string; value: string; share: number }[]>(() => {
    if (!this.detail.hasValue()) {
      return [];
    }
    const times = this.detail.value().hrTimeInZone;
    const total = times.reduce<number>((sum, seconds) => sum + Math.max(seconds ?? 0, 0), 0);
    return (
      times
        .flatMap((seconds, index) =>
          seconds === null || seconds <= 0
            ? []
            : [
                {
                  label: fill(TEXTS.dashboard.detail.zoneLabel, { n: index + 1 }),
                  value: fill(TEXTS.dashboard.detail.minutes, {
                    value: Math.round(seconds / SECONDS_PER_MINUTE),
                  }),
                  share: total > 0 ? Math.round((seconds / total) * 100) : 0,
                },
              ],
        )
        // Zone la plus haute en premier.
        .reverse()
    );
  });
}

function formatStart(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
}

function formatMeters(meters: number | null): string {
  return meters === null ? '—' : fill(TEXTS.dashboard.detail.meters, { value: Math.round(meters) });
}

function formatCalories(kcal: number | null): string {
  return kcal === null ? '—' : fill(TEXTS.dashboard.detail.kcal, { value: Math.round(kcal) });
}

/** Allure en « m:ss /km », ou « — » sans distance. */
function paceLabel(durationSeconds: number, distanceMeters: number | null): string {
  if (distanceMeters === null || distanceMeters <= 0) {
    return '—';
  }
  const secondsPerKm = durationSeconds / (distanceMeters / METERS_PER_KILOMETER);
  const minutes = Math.floor(secondsPerKm / SECONDS_PER_MINUTE);
  const seconds = Math.round(secondsPerKm % SECONDS_PER_MINUTE);
  return fill(TEXTS.dashboard.detail.perKm, {
    value: `${minutes}:${String(seconds).padStart(2, '0')}`,
  });
}
