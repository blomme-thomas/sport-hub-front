import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
} from '@angular/core';
import { ChartComponent } from '@shared/ui/chart/chart.component';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { DashboardState } from '../data-access/dashboard.state';
import type { ChartKey } from '../models/training-stats.model';
import { CHART_KIND, chartDataOf, chartOptionsOf } from './chart-config';
import { ChartDataTableComponent } from './chart-data-table.component';
import { GranularityToggleComponent } from './granularity-toggle.component';

export interface ChartModalData {
  chart: ChartKey;
}

/**
 * Contenu de la modale d'agrandissement. Lit les données déjà chargées par le tableau de bord (aucun appel
 * au back à l'ouverture). Ng-zorro n'associe pas le nom de la modale à son titre : le titre du graphique
 * est donc porté par `aria-label` sur l'élément `role="dialog"`. Pendant l'ouverture, le reste de la page
 * est masqué aux lecteurs d'écran (`aria-hidden`), comme le fait une modale ; l'état est restauré à la
 * fermeture. Ng-zorro ferme sur Échap via `keyCode`, absent des événements synthétiques : la touche est donc
 * aussi écoutée ici, et l'événement déjà traité par ng-zorro (`defaultPrevented`) est ignoré.
 */
@Component({
  selector: 'sh-chart-modal',
  imports: [ChartComponent, ChartDataTableComponent, GranularityToggleComponent],
  templateUrl: './chart-modal.component.html',
  styleUrl: './chart-modal.component.scss',
  host: { '(document:keydown.escape)': 'onEscape($event)' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartModalComponent {
  protected readonly state = inject(DashboardState);

  private readonly modalData = inject<ChartModalData>(NZ_MODAL_DATA);
  private readonly modalRef = inject(NzModalRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  protected readonly chartView = computed(() => {
    const model = this.state.view()?.charts[this.modalData.chart];
    if (!model) {
      return null;
    }
    const kind = CHART_KIND[this.modalData.chart];
    return { model, data: chartDataOf(model), options: chartOptionsOf(model, kind) };
  });

  constructor() {
    let restoreBackground: (() => void) | null = null;
    afterNextRender(() => {
      restoreBackground = this.hideBackground();
    });
    inject(DestroyRef).onDestroy(() => restoreBackground?.());

    afterRenderEffect(() => {
      const title = this.chartView()?.model.title;
      const dialog = this.host.nativeElement.closest('[role="dialog"]');
      if (title && dialog) {
        this.renderer.setAttribute(dialog, 'aria-label', title);
      }
    });
  }

  protected onEscape(event: Event): void {
    if (!event.defaultPrevented) {
      this.modalRef?.close();
    }
  }

  private hideBackground(): () => void {
    const hostElement = this.host.nativeElement;
    const hidden = Array.from(this.document.body.children).filter(
      (child) => !child.contains(hostElement) && !child.hasAttribute('aria-hidden'),
    );
    for (const child of hidden) {
      this.renderer.setAttribute(child, 'aria-hidden', 'true');
    }
    return () => {
      for (const child of hidden) {
        this.renderer.removeAttribute(child, 'aria-hidden');
      }
    };
  }
}
