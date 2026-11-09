import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { IconComponent, type IconName } from '@shared/ui/icon/icon.component';
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

const ICON_BY_ID: Record<DashboardKpi['id'], IconName> = {
  sessions: 'calendar',
  duration: 'clock',
  calories: 'flame',
  elevation: 'mountain',
  heartRate: 'heart',
};

const SPARKLINE_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  // Marge interne : une série à 0 ne tombe plus sur le bord, où Chart.js découpe la moitié du trait.
  layout: { padding: { top: 3, bottom: 3, left: 2, right: 2 } },
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: { x: { display: false }, y: { display: false } },
  elements: { point: { radius: 0 }, line: { borderWidth: 2, tension: 0.35 } },
};

@Component({
  selector: 'sh-kpi-card',
  imports: [ChartComponent, VariationBadgeComponent, IconComponent],
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
          // Un jour sans valeur compte pour 0 : sinon Chart.js coupe la courbe à ce point.
          data: kpi.series.map((value) => value ?? 0),
          borderColor: readCssVar(TONE_VARIABLES[kpi.tone]),
          backgroundColor: 'transparent',
          // Pas de découpe sur la zone de tracé : le trait garde sa largeur même à 0.
          clip: false,
        },
      ],
    };
  });

  protected readonly sparkOptions = SPARKLINE_OPTIONS;
  protected readonly iconName = computed(() => ICON_BY_ID[this.kpi().id]);
}
