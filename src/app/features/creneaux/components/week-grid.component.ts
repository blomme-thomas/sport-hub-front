import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { layoutDaySlots, minutesToTime } from '../data-access/slot.mapper';
import { slotTypeLabel } from '../models/slot-options';
import type { Slot, SlotDefaults } from '../models/slot.model';
import type { WeekDay } from '../models/week-day.model';

/** Hauteur d'une heure dans la grille, en pixels. */
const PX_PER_HOUR = 48;
const HOURS = 24;
const MINUTES_PER_HOUR = 60;
const DAY_MINUTES = HOURS * MINUTES_PER_HOUR;
/** Pas de la sélection à la souris, en minutes. */
const SNAP_MINUTES = 30;
/** Durée proposée par un simple clic sur une colonne. */
const DEFAULT_DURATION_MINUTES = 60;
/** Hauteur minimale d'un créneau, pour que son libellé reste lisible. */
const MIN_SLOT_HEIGHT_PX = 20;
const SLOT_GAP_PX = 2;

interface DragState {
  date: string;
  pointerId: number;
  anchorMinutes: number;
  currentMinutes: number;
}

interface PositionedBlock {
  slot: Slot;
  label: string;
  timeRange: string;
  top: number;
  height: number;
  left: number;
  width: number;
}

interface GridColumn {
  date: string;
  shortLabel: string;
  longLabel: string;
  blocks: readonly PositionedBlock[];
}

/**
 * Grille d'une semaine : une colonne par jour, de 00:00 à 24:00. Cliquer sur un créneau émet ce créneau ;
 * glisser sur une colonne émet la plage choisie (pas de 30 min, un clic seul propose une heure).
 * Présentationnel : ne charge rien et ne modifie rien.
 */
@Component({
  selector: 'sh-week-grid',
  imports: [],
  templateUrl: './week-grid.component.html',
  styleUrl: './week-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekGridComponent {
  readonly days = input.required<readonly WeekDay[]>();

  readonly slotSelected = output<Slot>();
  readonly rangeSelected = output<SlotDefaults>();

  protected readonly hourHeight = PX_PER_HOUR;
  protected readonly gridHeight = HOURS * PX_PER_HOUR;
  protected readonly hours = Array.from({ length: HOURS }, (_, hour) => ({
    top: hour * PX_PER_HOUR,
    label: `${String(hour).padStart(2, '0')}:00`,
  }));

  private readonly drag = signal<DragState | null>(null);

  protected readonly columns = computed<GridColumn[]>(() =>
    this.days().map((day) => ({
      date: day.date,
      shortLabel: formatShortDay(day.date),
      longLabel: formatLongDay(day.date),
      blocks: layoutDaySlots(day.slots).map((positioned) => {
        const timeRange = `${minutesToTime(positioned.startMinutes)} – ${minutesToTime(positioned.endMinutes)}`;
        return {
          slot: positioned.slot,
          label: describeSlot(positioned.slot, timeRange),
          timeRange,
          top: (positioned.startMinutes * PX_PER_HOUR) / MINUTES_PER_HOUR,
          height: Math.max(
            ((positioned.endMinutes - positioned.startMinutes) * PX_PER_HOUR) / MINUTES_PER_HOUR -
              SLOT_GAP_PX,
            MIN_SLOT_HEIGHT_PX,
          ),
          left: (positioned.lane * 100) / positioned.laneCount,
          width: 100 / positioned.laneCount,
        };
      }),
    })),
  );

  /** Plage en cours de sélection, dessinée dans la colonne concernée. */
  protected readonly preview = computed(() => {
    const current = this.drag();
    if (current === null) {
      return null;
    }
    const { start, end } = rangeOf(current);
    return {
      date: current.date,
      top: (start * PX_PER_HOUR) / MINUTES_PER_HOUR,
      height: ((end - start) * PX_PER_HOUR) / MINUTES_PER_HOUR,
      label: `${minutesToTime(start)} – ${minutesToTime(end)}`,
    };
  });

  protected onColumnPointerDown(event: PointerEvent, date: string): void {
    if (event.button !== 0 || isOnSlot(event)) {
      return;
    }
    const column = event.currentTarget as HTMLElement;
    column.setPointerCapture(event.pointerId);
    const minutes = minutesAt(event, column);
    this.drag.set({
      date,
      pointerId: event.pointerId,
      anchorMinutes: minutes,
      currentMinutes: minutes,
    });
  }

  protected onColumnPointerMove(event: PointerEvent): void {
    const current = this.drag();
    if (current === null || current.pointerId !== event.pointerId) {
      return;
    }
    const minutes = minutesAt(event, event.currentTarget as HTMLElement);
    this.drag.set({ ...current, currentMinutes: minutes });
  }

  protected onColumnPointerUp(event: PointerEvent): void {
    const current = this.drag();
    if (current === null || current.pointerId !== event.pointerId) {
      return;
    }
    this.drag.set(null);
    const { start, end } = rangeOf(current);
    this.rangeSelected.emit({
      date: current.date,
      startTime: minutesToTime(start),
      endTime: minutesToTime(end),
    });
  }

  protected onColumnPointerCancel(): void {
    this.drag.set(null);
  }
}

/** Plage de la sélection : bornes triées et alignées sur le pas, ou une heure à partir du clic. */
function rangeOf(drag: DragState): { start: number; end: number } {
  const low = Math.min(drag.anchorMinutes, drag.currentMinutes);
  const high = Math.max(drag.anchorMinutes, drag.currentMinutes);
  if (high - low >= SNAP_MINUTES) {
    return { start: low, end: high };
  }
  const start = Math.min(low, DAY_MINUTES - SNAP_MINUTES);
  return { start, end: Math.min(start + DEFAULT_DURATION_MINUTES, DAY_MINUTES) };
}

/** Minutes depuis minuit sous le pointeur, arrondies au pas et bornées à la journée. */
function minutesAt(event: PointerEvent, column: HTMLElement): number {
  const rect = column.getBoundingClientRect();
  const minutes = ((event.clientY - rect.top) * MINUTES_PER_HOUR) / PX_PER_HOUR;
  const snapped = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(Math.max(snapped, 0), DAY_MINUTES);
}

function isOnSlot(event: PointerEvent): boolean {
  return event.target instanceof Element && event.target.closest('.week-grid__slot') !== null;
}

function describeSlot(slot: Slot, timeRange: string): string {
  const recurrence = slot.recurrence === 'hebdomadaire' ? ', chaque semaine' : '';
  return `${slotTypeLabel(slot.type)}, ${timeRange}${recurrence}. Modifier`;
}

function formatShortDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatLongDay(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}
