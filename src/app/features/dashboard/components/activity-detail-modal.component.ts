import { ChangeDetectionStrategy, Component, computed, inject, resource } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { firstValueFrom } from 'rxjs';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { RecentActivitiesApi } from '../data-access/recent-activities.api';
import {
  formatDistance,
  formatDuration,
  formatHeartRate,
} from '../data-access/recent-activities.mapper';
import type { ActivityDetailApi, HeartRateSampleApi } from '../models/recent-activity.api-model';
import { detailChartOptions, heartRateChartData } from './heart-rate-chart.config';

/** Donnée transmise à la modale : identifiant de l'activité. */
export interface ActivityDetailModalData {
  id: string;
}

const SECONDS_PER_MINUTE = 60;

/**
 * Détail complet d'une activité : métriques, répartition par zone de FC et courbe de FC.
 * Les données sont chargées à l'ouverture (`GET /api/activities/:id`) ; une erreur reste affichée dans la modale.
 */
@Component({
  selector: 'sh-activity-detail-modal',
  imports: [ChartComponent],
  templateUrl: './activity-detail-modal.component.html',
  styleUrl: './activity-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityDetailModalComponent {
  private readonly data = inject<ActivityDetailModalData>(NZ_MODAL_DATA);
  private readonly api = inject(RecentActivitiesApi);

  protected readonly detail = resource<ActivityDetailApi, string>({
    params: () => this.data.id,
    loader: ({ params }) => firstValueFrom(this.api.detail(params)),
  });

  /** Message utilisateur de l'erreur de chargement, `null` sinon. */
  protected readonly errorMessage = computed<string | null>(() => {
    const error = this.detail.error();
    return error === undefined ? null : toAppError(error).userMessage;
  });

  protected readonly samples = computed<readonly HeartRateSampleApi[]>(() =>
    this.detail.hasValue() ? (this.detail.value().heartRateSeries ?? []) : [],
  );
  protected readonly chartData = computed(() => heartRateChartData(this.samples()));
  protected readonly chartOptions = detailChartOptions();

  /** Lignes des métriques, déjà formatées. Une valeur absente s'affiche « — ». */
  protected readonly rows = computed<{ label: string; value: string }[]>(() => {
    if (!this.detail.hasValue()) {
      return [];
    }
    const activity = this.detail.value();
    return [
      { label: 'Type', value: activity.type.replaceAll('_', ' ') },
      { label: 'Date', value: formatStart(activity.startedAt) },
      { label: 'Durée', value: formatDuration(activity.durationSeconds) },
      { label: 'Distance', value: formatDistance(activity.distanceMeters) },
      { label: 'Dénivelé positif', value: formatMeters(activity.elevationGainMeters) },
      { label: 'Calories', value: formatCalories(activity.calories) },
      { label: 'FC moyenne', value: formatHeartRate(activity.averageHeartRate) },
      { label: 'FC maximale', value: formatHeartRate(activity.maxHeartRate) },
    ];
  });

  /** Temps passé dans chaque zone de FC, en minutes, pour les zones renseignées. */
  protected readonly zones = computed<{ label: string; value: string }[]>(() => {
    if (!this.detail.hasValue()) {
      return [];
    }
    return this.detail.value().hrTimeInZone.flatMap((seconds, index) =>
      seconds === null || seconds <= 0
        ? []
        : [
            {
              label: `Zone ${index + 1}`,
              value: `${Math.round(seconds / SECONDS_PER_MINUTE)} min`,
            },
          ],
    );
  });
}

function formatStart(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' });
}

function formatMeters(meters: number | null): string {
  return meters === null ? '—' : `${Math.round(meters)} m`;
}

function formatCalories(kcal: number | null): string {
  return kcal === null ? '—' : `${Math.round(kcal)} kcal`;
}
