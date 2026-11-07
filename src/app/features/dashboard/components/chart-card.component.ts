import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import type { ChartModel } from '../models/training-stats.model';
import { ChartDataTableComponent } from './chart-data-table.component';
import { ChartKind, chartDataOf, chartOptionsOf } from './chart-config';

@Component({
  selector: 'sh-chart-card',
  imports: [ChartComponent, ChartDataTableComponent],
  templateUrl: './chart-card.component.html',
  styleUrl: './chart-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartCardComponent {
  readonly model = input.required<ChartModel>();
  readonly kind = input<ChartKind>('bar');
  readonly expand = output<void>();

  protected readonly data = computed(() => chartDataOf(this.model()));
  protected readonly options = computed(() => chartOptionsOf(this.model(), this.kind()));
  protected readonly expandLabel = computed(() => `Agrandir le graphique : ${this.model().title}`);
}
