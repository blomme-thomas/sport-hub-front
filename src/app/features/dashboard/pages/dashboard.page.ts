import {
  ChangeDetectionStrategy,
  Component,
  ViewContainerRef,
  computed,
  inject,
} from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { ChartCardComponent } from '../components/chart-card.component';
import { CHART_KIND } from '../components/chart-config';
import {
  ActivityDetailModalComponent,
  type ActivityDetailModalData,
} from '../components/activity-detail-modal.component';
import { ChartModalComponent, type ChartModalData } from '../components/chart-modal.component';
import { GranularityToggleComponent } from '../components/granularity-toggle.component';
import { NextEventCardComponent } from '../components/next-event-card.component';
import { KpiCardComponent } from '../components/kpi-card.component';
import { PerformanceCardComponent } from '../components/performance-card.component';
import { RecentActivitiesCardComponent } from '../components/recent-activities-card.component';
import { SportSplitCardComponent } from '../components/sport-split-card.component';
import { WeeklyReviewCardComponent } from '../components/weekly-review-card.component';
import { WeekMiniCalendarComponent } from '../components/week-mini-calendar.component';
import { DashboardKpisState } from '../data-access/dashboard-kpis.state';
import { DashboardState } from '../data-access/dashboard.state';
import { NextEventState } from '../data-access/next-event.state';
import { HeartRateZonesState } from '../data-access/heart-rate-zones.state';
import { PerformanceState } from '../data-access/performance.state';
import { WeeklyReviewState } from '../data-access/weekly-review.state';
import { RecentActivitiesState } from '../data-access/recent-activities.state';
import { WeekMiniCalendarState } from '../data-access/week-mini-calendar.state';
import type { ChartKey, Granularity } from '../models/training-stats.model';

const GRANULARITY_WORDS: Record<Granularity, string> = { week: 'semaine', month: 'mois' };

@Component({
  selector: 'sh-dashboard-page',
  imports: [
    NzButtonComponent,
    ChartCardComponent,
    GranularityToggleComponent,
    KpiCardComponent,
    NextEventCardComponent,
    PerformanceCardComponent,
    RecentActivitiesCardComponent,
    SportSplitCardComponent,
    WeekMiniCalendarComponent,
    WeeklyReviewCardComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  providers: [
    DashboardState,
    DashboardKpisState,
    NextEventState,
    RecentActivitiesState,
    PerformanceState,
    WeeklyReviewState,
    HeartRateZonesState,
    WeekMiniCalendarState,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  /** Bilan de la semaine masqué tant que le token IA n'est pas disponible (story #16). */
  protected readonly weeklyReviewEnabled = false;
  protected readonly state = inject(DashboardState);
  protected readonly kpis = inject(DashboardKpisState);
  protected readonly nextEvent = inject(NextEventState);
  protected readonly recent = inject(RecentActivitiesState);
  protected readonly chartKinds = CHART_KIND;
  protected readonly miniCalendar = inject(WeekMiniCalendarState);

  private readonly router = inject(Router);

  private readonly modal = inject(NzModalService);
  private readonly viewContainer = inject(ViewContainerRef);

  protected readonly statusMessage = computed(() => {
    if (this.state.isLoading()) {
      return 'Chargement des statistiques en cours';
    }
    return this.state.view()
      ? `Statistiques affichées par ${GRANULARITY_WORDS[this.state.granularity()]}`
      : '';
  });

  /** Ouvre le détail complet d'une séance réalisée (toutes les métriques, zones et courbe de FC). */
  protected openActivity(id: string): void {
    const ref = this.modal.create({
      nzTitle: 'Détail de la séance',
      nzContent: ActivityDetailModalComponent,
      nzData: { id } satisfies ActivityDetailModalData,
      nzViewContainerRef: this.viewContainer,
      nzKeyboard: true,
      nzFooter: [{ label: 'Fermer', onClick: () => ref.close() }],
    });
  }

  /** Ouvre la fiche d'une séance depuis le mini-calendrier (lecture seule ailleurs). */
  protected openSession(id: string): void {
    void this.router.navigate(['/seances', id]);
  }

  protected openChart(chart: ChartKey): void {
    const title = this.state.view()?.charts[chart].title ?? '';
    const ref = this.modal.create({
      nzTitle: title,
      nzContent: ChartModalComponent,
      nzData: { chart } satisfies ChartModalData,
      nzViewContainerRef: this.viewContainer,
      nzKeyboard: true,
      nzFooter: [{ label: 'Fermer', onClick: () => ref.close() }],
    });
  }
}
