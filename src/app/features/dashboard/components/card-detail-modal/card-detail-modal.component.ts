import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Renderer2,
  afterNextRender,
  inject,
} from '@angular/core';
import type { ChartData, ChartOptions } from 'chart.js';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { readCssVar } from '@shared/utils/css-var';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { TONE_VARIABLES } from '../kpi-card/kpi-card.component';
import { VariationBadgeComponent } from '../variation-badge/variation-badge.component';
import type { CardDetail } from '../../models/card-detail.model';

export interface CardDetailModalData {
  detail: CardDetail;
}

/**
 * Vue détaillée d'une carte du tableau de bord (story #91). Présentationnelle : reçoit un instantané
 * calculé à l'ouverture, sans appel au back. Échap ferme la modale (géré par ng-zorro), et le focus
 * revient à la carte. Ng-zorro n'associe pas le titre au dialogue : son nom est donc posé en `aria-label`.
 */
@Component({
  selector: 'sh-card-detail-modal',
  imports: [ChartComponent, NzButtonComponent, VariationBadgeComponent],
  templateUrl: './card-detail-modal.component.html',
  styleUrl: './card-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDetailModalComponent {
  protected readonly data = inject<CardDetailModalData>(NZ_MODAL_DATA);
  /** Graphique agrandi d'un indicateur à série ; `null` pour les autres vues. */
  protected readonly chart = lineChartOf(this.data.detail);
  private readonly modalRef = inject(NzModalRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  constructor() {
    afterNextRender(() => {
      const dialog = this.host.nativeElement.closest('[role="dialog"]');
      if (dialog) {
        this.renderer.setAttribute(dialog, 'aria-label', this.data.detail.title);
      }
    });
  }

  protected close(): void {
    this.modalRef?.close();
  }
}

/** Graphique agrandi d'un indicateur : axes, grille horizontale fine et pointillée, valeurs au survol. */
interface LineChartView {
  label: string;
  data: ChartData<'line'>;
  options: ChartOptions<'line'>;
}

function lineChartOf(detail: CardDetail): LineChartView | null {
  if (detail.kind !== 'kpi' || detail.series === undefined) {
    return null;
  }
  const { labels, values, tone, axisUnit } = detail.series;
  const text = readCssVar('--sh-chart-text');
  const grid = readCssVar('--sh-chart-grid');
  const color = readCssVar(TONE_VARIABLES[tone]);
  return {
    label: `${detail.title} sur la période`,
    data: {
      labels,
      datasets: [
        {
          label: detail.title,
          data: values.map((value) => value ?? 0),
          borderColor: color,
          backgroundColor: color,
          pointBackgroundColor: color,
          pointRadius: 3,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          border: { display: false },
          grid: { display: false },
          ticks: { color: text, autoSkip: true, maxTicksLimit: 10, maxRotation: 0 },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: grid, drawTicks: false, tickBorderDash: [4, 4] },
          ticks: {
            color: text,
            padding: 8,
            callback: (value) => (axisUnit === null ? `${value}` : `${value} ${axisUnit}`),
          },
        },
      },
    },
  };
}
