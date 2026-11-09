import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { resource } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RecentActivitiesApi } from '../data-access/recent-activities.api';
import type { ActivityDetailApi, HeartRateSampleApi } from '../models/recent-activity.api-model';
import type { RecentActivity } from '../models/recent-activity.model';
import { SPARKLINE_OPTIONS, heartRateChartData } from './heart-rate-chart.config';

/**
 * Une séance récente : titre, jour, durée, distance, fréquence cardiaque moyenne au-dessus d'une courbe de FC.
 * La courbe vient du détail de l'activité, chargé pour cette ligne seulement. Un clic émet l'identifiant.
 */
@Component({
  selector: 'sh-recent-activity-row',
  imports: [ChartComponent],
  templateUrl: './recent-activity-row.component.html',
  styleUrl: './recent-activity-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivityRowComponent {
  readonly activity = input.required<RecentActivity>();
  readonly opened = output<string>();

  private readonly api = inject(RecentActivitiesApi);

  private readonly detail = resource<ActivityDetailApi, string>({
    params: () => this.activity().id,
    loader: ({ params }) => firstValueFrom(this.api.detail(params)),
  });

  protected readonly samples = computed<readonly HeartRateSampleApi[]>(() =>
    this.detail.hasValue() ? (this.detail.value().heartRateSeries ?? []) : [],
  );
  protected readonly chartData = computed(() => heartRateChartData(this.samples()));
  protected readonly sparkOptions = SPARKLINE_OPTIONS;
}
