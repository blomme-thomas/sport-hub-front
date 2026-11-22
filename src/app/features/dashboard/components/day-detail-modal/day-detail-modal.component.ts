import {
  ChangeDetectionStrategy,
  Component,
  ViewContainerRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { SessionModalService } from '@core/layout/session-modal.service';
import { disciplineStyleOf } from '@shared/ui/discipline/discipline-style';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { firstValueFrom } from 'rxjs';
import { NZ_MODAL_DATA, NzModalService } from 'ng-zorro-antd/modal';
import { RecentActivitiesApi } from '../../data-access/recent-activities.api';
import {
  formatDistance,
  formatDuration,
  formatHeartRate,
  toRecentActivity,
} from '../../data-access/recent-activities.mapper';
import { WeekMiniCalendarState } from '../../data-access/week-mini-calendar.state';
import type { RecentActivity } from '../../models/recent-activity.model';
import type { ActivitySummaryApi } from '../../models/recent-activity.api-model';
import type { WeekMiniSession } from '../../models/week-mini-calendar.model';
import {
  ActivityDetailModalComponent,
  type ActivityDetailModalData,
} from '../activity-detail-modal/activity-detail-modal.component';
import { TEXTS } from '@shared/texts/texts';

export interface DayDetailModalData {
  /** Date du jour, `YYYY-MM-DD`. */
  date: string;
}

/** Zones cardiaques affichées, avec leur nom et leur couleur (mêmes tokens que la carte Zones). */
const ZONES = [
  { label: 'Z1', name: TEXTS.dashboard.zones.names.z1, color: '--sh-text-muted' },
  { label: 'Z2', name: TEXTS.dashboard.zones.names.z2, color: '--sh-success' },
  { label: 'Z3', name: TEXTS.dashboard.zones.names.z3, color: '--sh-orange' },
  { label: 'Z4', name: TEXTS.dashboard.zones.names.z4, color: '--sh-danger' },
  { label: 'Z5', name: TEXTS.dashboard.zones.names.z5, color: '--sh-violet' },
] as const;

const NO_VALUE = '—';

interface ZoneRow {
  label: string;
  name: string;
  color: string;
  percent: number;
  durationLabel: string;
}

/**
 * Modale d'un jour du mini-calendrier : résumé chiffré, séances planifiées et activités réalisées (cliquables),
 * puis répartition des zones de fréquence cardiaque du jour. Lecture seule.
 */
@Component({
  selector: 'sh-day-detail-modal',
  imports: [IconComponent],
  templateUrl: './day-detail-modal.component.html',
  styleUrl: './day-detail-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayDetailModalComponent {
  protected readonly t = TEXTS;
  private readonly data = inject<DayDetailModalData>(NZ_MODAL_DATA);
  private readonly state = inject(WeekMiniCalendarState);
  private readonly api = inject(RecentActivitiesApi);
  private readonly sessionModal = inject(SessionModalService);
  private readonly modals = inject(NzModalService);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly day = this.state.dayOf(this.data.date);
  protected readonly sessions: readonly WeekMiniSession[] = this.day.sessions;
  protected readonly now = new Date();
  protected readonly activityRows: readonly RecentActivity[] = this.day.activities.map((item) =>
    toRecentActivity(item, this.now),
  );

  /** Secondes par zone, sommées sur les activités du jour ; `null` tant que le détail se charge. */
  private readonly zoneSecondsValue = signal<number[] | null>(null);
  protected readonly zonesLoading = computed(() => this.zoneSecondsValue() === null);

  protected readonly summary = computed(() => summaryOf(this.day.activities));

  protected readonly zoneRows = computed<ZoneRow[]>(() => {
    const seconds = this.zoneSecondsValue() ?? [];
    const total = seconds.reduce((sum, value) => sum + value, 0);
    return ZONES.map((zone, index) => {
      const value = seconds[index] ?? 0;
      return {
        label: zone.label,
        name: zone.name,
        color: zone.color,
        percent: total === 0 ? 0 : Math.round((value / total) * 100),
        durationLabel: formatDuration(value),
      };
    });
  });

  protected readonly hasZones = computed(() =>
    (this.zoneSecondsValue() ?? []).some((value) => value > 0),
  );

  constructor() {
    void this.loadZones();
  }

  /** Style (pictogramme et couleur) d'une discipline. */
  protected styleOf(typeKey: string) {
    return disciplineStyleOf(typeKey);
  }

  /** Libellé du référentiel d'une discipline, ou la clé si elle est absente de la légende. */
  protected labelOf(typeKey: string): string {
    return this.state.legend().find((entry) => entry.typeKey === typeKey)?.label ?? typeKey;
  }

  /** Heure de début de la séance, ou « Sans heure ». */
  protected timeOf(session: WeekMiniSession): string {
    return session.startTime ?? TEXTS.dashboard.detail.noSample;
  }

  protected openSession(id: string): void {
    this.sessionModal.open(id, { backToDay: true });
  }

  /** Ouvre le détail d'une activité par-dessus la modale du jour. */
  protected openActivity(id: string): void {
    this.modals.create({
      nzTitle: TEXTS.dashboard.detailTitle,
      nzContent: ActivityDetailModalComponent,
      nzData: { id } satisfies ActivityDetailModalData,
      nzViewContainerRef: this.viewContainer,
      nzWidth: 'min(1400px, 96vw)',
      nzClassName: 'sh-modal',
      nzKeyboard: true,
      nzFooter: null,
    });
  }

  /** Somme, par zone, du temps passé sur les activités du jour (le détail de chaque activité est demandé). */
  private async loadZones(): Promise<void> {
    const details = await Promise.all(
      this.day.activities.map((item) => firstValueFrom(this.api.detail(item.id)).catch(() => null)),
    );
    const totals = ZONES.map((_, index) =>
      details.reduce((sum, detail) => sum + (detail?.hrTimeInZone[index] ?? 0), 0),
    );
    this.zoneSecondsValue.set(totals);
  }
}

/** Résumé chiffré du jour : durée, distance et fréquence cardiaque moyenne des activités réalisées. */
function summaryOf(activities: readonly ActivitySummaryApi[]): {
  duration: string;
  distance: string;
  heartRate: string;
} {
  if (activities.length === 0) {
    return { duration: NO_VALUE, distance: NO_VALUE, heartRate: NO_VALUE };
  }
  const seconds = activities.reduce((sum, item) => sum + item.durationSeconds, 0);
  const distances = activities
    .map((item) => item.distanceMeters)
    .filter((value): value is number => value !== null);
  const distance = distances.length === 0 ? null : distances.reduce((sum, value) => sum + value, 0);
  const heartRates = activities
    .map((item) => item.averageHeartRate)
    .filter((value): value is number => value !== null && value > 0);
  const heartRate =
    heartRates.length === 0
      ? null
      : heartRates.reduce((sum, value) => sum + value, 0) / heartRates.length;
  return {
    duration: formatDuration(seconds),
    distance: formatDistance(distance),
    heartRate: formatHeartRate(heartRate),
  };
}
