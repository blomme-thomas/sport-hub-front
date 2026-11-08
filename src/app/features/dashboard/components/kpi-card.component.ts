import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { readCssVar } from '@shared/utils/css-var';
import type { ChartData, ChartOptions } from 'chart.js';
import type { DashboardKpi, KpiTone } from '../models/dashboard-kpi.model';
import { VariationBadgeComponent } from './variation-badge.component';

const TONE_VARIABLES: Record<KpiTone, string> = {
  accent: '--sh-accent-text',
  success: '--sh-success',
  orange: '--sh-orange',
  violet: '--sh-violet',
  danger: '--sh-danger',
};

const SPARKLINE_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 }, line: { borderWidth: 2, tension: 0.35 } },
};

@Component({
  selector: 'sh-kpi-card',
  imports: [ChartComponent, VariationBadgeComponent],
  templateUrl: './kpi-card.component.html',
  styleUrl: './kpi-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KpiCardComponent {
  readonly kpi = input.required<DashboardKpi>();

  protected readonly sparkData = computed<ChartData<'line'> | null>(() => {
    const kpi = this.kpi();
    if (kpi.series === null) {
      return null;
    }
    return {
      labels: kpi.series.map((_, index) => String(index)),
      datasets: [
        {
          data: kpi.series,
          borderColor: readCssVar(TONE_VARIABLES[kpi.tone]),
          backgroundColor: 'transparent',
        },
      ],
    };
  });

  protected readonly sparkOptions = SPARKLINE_OPTIONS;
}
