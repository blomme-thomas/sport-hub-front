// Squelette — à copier dans features/<feature>/components/<name>-chart.component.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/08-styling-ui-and-accessibility.instructions.md (section Chart.js)
//
// Graphique = composant de présentation : données typées en input(), config Chart.js dans un computed.

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
// Wrapper maison unique autour de Chart.js (canvas + instance), à créer dans shared/ui/chart.
import { ChartComponent } from '@shared/ui/chart/chart.component';

export interface WeeklyLoadPoint {
  weekLabel: string;
  load: number;
}

@Component({
  selector: 'sh-weekly-load-chart',
  imports: [ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (points().length) {
      <sh-chart
        type="bar"
        [data]="data()"
        [options]="options"
        role="img"
        [attr.aria-label]="ariaLabel()"
      />
    } @else {
      <p>Aucune donnée à afficher.</p>
    }
  `,
})
export class WeeklyLoadChartComponent {
  readonly points = input.required<WeeklyLoadPoint[]>();

  protected readonly data = computed<ChartData<'bar'>>(() => ({
    labels: this.points().map((p) => p.weekLabel),
    datasets: [
      {
        label: 'Charge',
        data: this.points().map((p) => p.load),
        // Couleur : lire un token CSS (--sh-chart-1), pas de hex en dur
      },
    ],
  }));

  protected readonly options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  protected readonly ariaLabel = computed(
    () => `Charge hebdomadaire sur ${this.points().length} semaines`,
  );
}
