import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  ViewContainerRef,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { Router } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import {
  CardDetailModalComponent,
  type CardDetailModalData,
} from '../components/card-detail-modal/card-detail-modal.component';
import type { CardDetail } from '../models/card-detail.model';
import type { DashboardKpi } from '../models/dashboard-kpi.model';
import type { ZoneFloors } from '../models/heart-rate-zones.model';
import { formatDuration } from '../data-access/recent-activities.mapper';
import {
  ActivityDetailModalComponent,
  type ActivityDetailModalData,
} from '../components/activity-detail-modal/activity-detail-modal.component';
import { PeriodSelectorComponent } from '../components/period-selector/period-selector.component';
import { NextEventCardComponent } from '../components/next-event-card/next-event-card.component';
import { KpiCardComponent } from '../components/kpi-card/kpi-card.component';
import { PerformanceCardComponent } from '../components/performance-card/performance-card.component';
import { RecentActivitiesCardComponent } from '../components/recent-activities-card/recent-activities-card.component';
import { SportSplitCardComponent } from '../components/sport-split-card/sport-split-card.component';
import { ZonesCardComponent } from '../components/zones-card/zones-card.component';
import {
  DayDetailModalComponent,
  type DayDetailModalData,
} from '../components/day-detail-modal/day-detail-modal.component';
import { AI_FEATURES } from '../../../core/config/ai-features';
import { WeeklyReviewCardComponent } from '../components/weekly-review-card/weekly-review-card.component';
import { DashboardAdviceCardComponent } from '../components/dashboard-advice-card/dashboard-advice-card.component';
import { DashboardAdviceState } from '../data-access/dashboard-advice.state';
import { WeeklyGoalCardComponent } from '../components/weekly-goal-card/weekly-goal-card.component';
import { WeeklyGoalState } from '../data-access/weekly-goal.state';
import { WeekMiniCalendarComponent } from '../components/week-mini-calendar/week-mini-calendar.component';
import { DashboardKpisState } from '../data-access/dashboard-kpis.state';
import { DashboardState } from '../data-access/dashboard.state';
import { NextEventState } from '../data-access/next-event.state';
import { HeartRateZonesState } from '../data-access/heart-rate-zones.state';
import { PerformanceState } from '../data-access/performance.state';
import { WeeklyReviewState } from '../data-access/weekly-review.state';
import { RecentActivitiesState } from '../data-access/recent-activities.state';
import { WeekMiniCalendarState } from '../data-access/week-mini-calendar.state';
import type { DashboardPeriod } from '../models/training-stats.model';

/** Libellé de la période dans le message d'état lu par les lecteurs d'écran. */
const PERIOD_WORDS: Record<DashboardPeriod, string> = {
  week: 'la semaine en cours',
  month: 'le mois en cours',
};

/** Unité affichée sur l'axe du graphique agrandi, pour les indicateurs qui en ont une. */
const AXIS_UNITS: Partial<Record<DashboardKpi['id'], string>> = {
  duration: 'h',
  calories: 'kcal',
};

@Component({
  selector: 'sh-dashboard-page',
  imports: [
    NzButtonComponent,
    IconComponent,
    PeriodSelectorComponent,
    KpiCardComponent,
    NextEventCardComponent,
    PerformanceCardComponent,
    RecentActivitiesCardComponent,
    SportSplitCardComponent,
    ZonesCardComponent,
    WeekMiniCalendarComponent,
    WeeklyReviewCardComponent,
    DashboardAdviceCardComponent,
    WeeklyGoalCardComponent,
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
    DashboardAdviceState,
    WeeklyGoalState,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage {
  /** Bilan de la semaine masqué tant que le token IA n'est pas disponible (story #16). */
  protected readonly weeklyReviewEnabled = inject(AI_FEATURES);
  /** Conseil du tableau de bord : fonctionnalité IA, masquée tant qu'elle est désactivée. */
  protected readonly aiEnabled = inject(AI_FEATURES);
  /** Titre de la modale de détail : icône de la carte « Détails par séance » et libellé. */
  protected readonly activityDetailTitle =
    viewChild.required<TemplateRef<object>>('activityDetailTitle');
  protected readonly state = inject(DashboardState);
  protected readonly kpis = inject(DashboardKpisState);
  protected readonly nextEvent = inject(NextEventState);
  protected readonly recent = inject(RecentActivitiesState);
  protected readonly advice = inject(DashboardAdviceState);
  protected readonly weeklyGoal = inject(WeeklyGoalState);
  protected readonly heartZones = inject(HeartRateZonesState);

  protected readonly miniCalendar = inject(WeekMiniCalendarState);

  private readonly router = inject(Router);

  private readonly modal = inject(NzModalService);
  private readonly viewContainer = inject(ViewContainerRef);

  protected readonly statusMessage = computed(() => {
    if (this.state.isLoading()) {
      return 'Chargement des statistiques en cours';
    }
    return this.state.view()
      ? `Statistiques affichées sur ${PERIOD_WORDS[this.state.period()]}`
      : '';
  });

  /** Vue détaillée d'un indicateur (story #91). */
  protected openKpi(kpi: DashboardKpi): void {
    this.openDetail({
      kind: 'kpi',
      title: kpi.label,
      value: kpi.value,
      unit: kpi.unit,
      variation: kpi.variation,
      ...(kpi.series !== null && kpi.seriesLabels
        ? {
            series: {
              labels: kpi.seriesLabels,
              values: kpi.series,
              tone: kpi.tone,
              axisUnit: AXIS_UNITS[kpi.id] ?? null,
            },
          }
        : {}),
    });
  }

  /** Vue détaillée de la répartition par sport. Sans donnée, ne fait rien. */
  protected openSplit(): void {
    const split = this.kpis.sportSplit();
    if (split === undefined) {
      return;
    }
    this.openDetail({
      kind: 'split',
      title: 'Répartition par sport',
      totalLabel: split.totalLabel,
      rows: split.shares.map((share) => ({
        label: share.label,
        percent: share.percent,
        durationLabel: share.durationLabel,
        colorVariable: share.colorVariable,
      })),
    });
  }

  /** Vue détaillée des zones de fréquence cardiaque, avec les seuils de l'utilisateur. Sans donnée, ne fait rien. */
  protected openZones(): void {
    const zones = this.kpis.zones();
    if (zones === undefined) {
      return;
    }
    const floors = this.heartZones.floors();
    this.openDetail({
      kind: 'zones',
      title: 'Zones d’entraînement',
      optimalPercent: zones.optimalPercent,
      statusMessage: zones.statusMessage,
      rows: zones.zones.map((zone) => ({
        label: zone.label,
        name: zone.name,
        percent: zone.percent,
        durationLabel: formatDuration(zone.seconds),
        floorBpm: floorOf(zone.label, floors),
        colorVariable: zone.colorVariable,
      })),
    });
  }

  private openDetail(detail: CardDetail): void {
    this.modal.create({
      nzTitle: detail.title,
      nzContent: CardDetailModalComponent,
      nzData: { detail } satisfies CardDetailModalData,
      nzViewContainerRef: this.viewContainer,
      nzWidth: 'min(720px, 96vw)',
      nzClassName: 'sh-activity-modal sh-card-detail-modal',
      nzKeyboard: true,
      nzFooter: null,
    });
  }

  /** Ouvre le détail complet d'une séance réalisée (toutes les métriques, zones et courbe de FC). */
  protected openActivity(id: string): void {
    this.modal.create({
      nzTitle: this.activityDetailTitle(),
      nzClassName: 'sh-activity-modal',
      nzWidth: 'min(1400px, 96vw)',
      nzContent: ActivityDetailModalComponent,
      nzData: { id } satisfies ActivityDetailModalData,
      nzViewContainerRef: this.viewContainer,
      nzKeyboard: true,
      nzFooter: null,
    });
  }

  /** Ouvre la modale d'un jour du mini-calendrier : résumé, séances, activités et zones du jour. */
  protected openDay(iso: string): void {
    this.modal.create({
      nzTitle: dayTitleOf(iso),
      nzContent: DayDetailModalComponent,
      nzData: { date: iso } satisfies DayDetailModalData,
      nzViewContainerRef: this.viewContainer,
      nzWidth: 'min(860px, 96vw)',
      nzClassName: 'sh-activity-modal',
      nzKeyboard: true,
      nzFooter: null,
    });
  }

  /** Ouvre la fiche d'une séance depuis le mini-calendrier (lecture seule ailleurs). */
  protected openSession(id: string): void {
    void this.router.navigate(['/seances', id]);
  }
}

/** Titre d'une journée : « Mardi 17 novembre 2026 ». */
function dayTitleOf(iso: string): string {
  const text = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Seuil bas (bpm) de la zone « Z1 » à « Z5 », `null` si les zones ne sont pas disponibles. */
function floorOf(label: string, floors: ZoneFloors | null): number | null {
  const index = Number(label.slice(1)) - 1;
  return floors?.[index] ?? null;
}
