import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { IconComponent, type IconName } from '@shared/ui/icon/icon.component';
import { layoutDaySlots, minutesToTime } from '../data-access/slot.mapper';
import { disciplineStyleOf } from '../models/discipline-style';
import { slotTypeLabel } from '../models/slot-options';
import type { SessionOccurrence } from '../models/session-occurrence.model';
import type { Slot, SlotDefaults } from '../models/slot.model';
import type { WeekDay } from '../models/week-day.model';

/** Hauteur d'une heure dans la grille, en pixels. */
const PX_PER_HOUR = 48;
const HOURS = 24;
const MINUTES_PER_HOUR = 60;
const DAY_MINUTES = HOURS * MINUTES_PER_HOUR;
/** Pas de la sélection et du déplacement à la souris, en minutes. */
const SNAP_MINUTES = 30;
/** Durée proposée par un simple clic sur une colonne. */
const DEFAULT_DURATION_MINUTES = 60;
/** Hauteur minimale d'un bloc, pour que son libellé reste lisible. */
const MIN_BLOCK_HEIGHT_PX = 20;
const BLOCK_GAP_PX = 2;
/** Distance à partir de laquelle un appui devient un déplacement (et non un clic). */
const MOVE_THRESHOLD_PX = 5;

/** Élément placé sur la grille : un créneau ou une séance. */
type GridItem =
  | { id: string; startTime: string; endTime: string; kind: 'slot'; slot: Slot }
  | { id: string; startTime: string; endTime: string; kind: 'session'; session: SessionOccurrence };

/** Déplacement d'un élément sur la grille, à enregistrer par la page. */
export type GridMove =
  | { kind: 'slot'; slot: Slot; date: string; startTime: string; endTime: string }
  | { kind: 'session'; session: SessionOccurrence; date: string; startTime: string };

interface DragState {
  date: string;
  pointerId: number;
  anchorMinutes: number;
  currentMinutes: number;
}

interface MoveState {
  block: PositionedBlock;
  element: HTMLElement;
  pointerId: number;
  startX: number;
  startY: number;
  moved: boolean;
  deltaY: number;
}

interface PositionedBlock {
  key: string;
  kind: 'slot' | 'session';
  date: string;
  slot: Slot | null;
  session: SessionOccurrence | null;
  label: string;
  timeRange: string;
  startMinutes: number;
  endMinutes: number;
  movable: boolean;
  top: number;
  height: number;
  left: number;
  width: number;
  icon: IconName | null;
  color: string;
}

interface GridColumn {
  date: string;
  shortLabel: string;
  longLabel: string;
  blocks: readonly PositionedBlock[];
}

/**
 * Grille d'une semaine : une colonne par jour, de 00:00 à 24:00. Affiche les créneaux (libres ou occupés) et les
 * séances (icône et couleur de leur discipline). Cliquer sur un créneau émet ce créneau, cliquer sur une séance
 * émet la séance ; glisser sur une colonne émet la plage choisie (pas de 30 min, un clic seul propose une heure).
 * Un élément déplaçable (créneau, ou séance ponctuelle) se glisse vers un autre jour ou une autre heure
 * (`moved`). Une séance récurrente ne se déplace pas ici (story #49).
 * Présentationnel : ne charge rien et ne modifie rien.
 */
@Component({
  selector: 'sh-week-grid',
  imports: [IconComponent],
  templateUrl: './week-grid.component.html',
  styleUrl: './week-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WeekGridComponent {
  readonly days = input.required<readonly WeekDay[]>();
  /** Libellés des disciplines, par clé. Une clé absente s'affiche telle quelle. */
  readonly labels = input<ReadonlyMap<string, string>>(new Map());

  readonly slotSelected = output<Slot>();
  readonly sessionSelected = output<SessionOccurrence>();
  readonly rangeSelected = output<SlotDefaults>();
  readonly moved = output<GridMove>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly hourHeight = PX_PER_HOUR;
  protected readonly gridHeight = HOURS * PX_PER_HOUR;
  protected readonly hours = Array.from({ length: HOURS }, (_, hour) => ({
    top: hour * PX_PER_HOUR,
    label: `${String(hour).padStart(2, '0')}:00`,
  }));

  private readonly drag = signal<DragState | null>(null);
  private move: MoveState | null = null;
  private suppressClick = false;

  protected readonly columns = computed<GridColumn[]>(() =>
    this.days().map((day) => ({
      date: day.date,
      shortLabel: formatShortDay(day.date),
      longLabel: formatLongDay(day.date),
      blocks: layoutDaySlots(itemsOf(day)).map((positioned) => {
        const item = positioned.slot;
        const timeRange = `${minutesToTime(positioned.startMinutes)} – ${minutesToTime(positioned.endMinutes)}`;
        const geometry = {
          top: (positioned.startMinutes * PX_PER_HOUR) / MINUTES_PER_HOUR,
          height: Math.max(
            ((positioned.endMinutes - positioned.startMinutes) * PX_PER_HOUR) / MINUTES_PER_HOUR -
              BLOCK_GAP_PX,
            MIN_BLOCK_HEIGHT_PX,
          ),
          left: (positioned.lane * 100) / positioned.laneCount,
          width: 100 / positioned.laneCount,
          startMinutes: positioned.startMinutes,
          endMinutes: positioned.endMinutes,
        };
        if (item.kind === 'slot') {
          return {
            key: item.id,
            kind: 'slot' as const,
            date: day.date,
            slot: item.slot,
            session: null,
            label: describeSlot(item.slot, timeRange),
            timeRange,
            movable: true,
            icon: null,
            color: '',
            ...geometry,
          };
        }
        const style = disciplineStyleOf(item.session.disciplineTypeKey);
        const disciplineLabel =
          this.labels().get(item.session.disciplineTypeKey) ?? item.session.disciplineTypeKey;
        return {
          key: item.id,
          kind: 'session' as const,
          date: day.date,
          slot: null,
          session: item.session,
          label: `Séance ${disciplineLabel}, ${timeRange}. Ouvrir la séance`,
          timeRange,
          movable: item.session.recurrence === 'aucune',
          icon: style.icon,
          color: style.color,
          ...geometry,
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

  protected onBlockClick(block: PositionedBlock): void {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }
    if (block.kind === 'slot' && block.slot !== null) {
      this.slotSelected.emit(block.slot);
    } else if (block.session !== null) {
      this.sessionSelected.emit(block.session);
    }
  }

  protected onBlockPointerDown(event: PointerEvent, block: PositionedBlock): void {
    this.suppressClick = false;
    if (event.button !== 0 || !block.movable) {
      return;
    }
    const element = event.currentTarget as HTMLElement;
    element.setPointerCapture(event.pointerId);
    this.move = {
      block,
      element,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      deltaY: 0,
    };
  }

  protected onBlockPointerMove(event: PointerEvent): void {
    const move = this.move;
    if (move === null || move.pointerId !== event.pointerId) {
      return;
    }
    const deltaX = event.clientX - move.startX;
    const deltaY = event.clientY - move.startY;
    if (!move.moved && Math.hypot(deltaX, deltaY) < MOVE_THRESHOLD_PX) {
      return;
    }
    move.moved = true;
    move.deltaY = deltaY;
    move.element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    move.element.style.zIndex = '2';
  }

  protected onBlockPointerUp(event: PointerEvent): void {
    const move = this.move;
    if (move === null || move.pointerId !== event.pointerId) {
      return;
    }
    this.move = null;
    move.element.style.transform = '';
    move.element.style.zIndex = '';
    if (!move.moved) {
      return;
    }
    this.suppressClick = true;

    const block = move.block;
    const date = this.columnAt(event.clientX) ?? block.date;
    const duration = block.endMinutes - block.startMinutes;
    const deltaMinutes =
      Math.round((move.deltaY * MINUTES_PER_HOUR) / PX_PER_HOUR / SNAP_MINUTES) * SNAP_MINUTES;
    const start = Math.min(Math.max(block.startMinutes + deltaMinutes, 0), DAY_MINUTES - duration);
    if (date === block.date && start === block.startMinutes) {
      return;
    }
    const startTime = minutesToTime(start);
    if (block.kind === 'slot' && block.slot !== null) {
      this.moved.emit({
        kind: 'slot',
        slot: block.slot,
        date,
        startTime,
        endTime: minutesToTime(start + duration),
      });
    } else if (block.session !== null) {
      this.moved.emit({ kind: 'session', session: block.session, date, startTime });
    }
  }

  protected onColumnPointerDown(event: PointerEvent, date: string): void {
    if (event.button !== 0 || isOnBlock(event)) {
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

  /** Date de la colonne située sous l'abscisse donnée, ou `null` hors de la grille. */
  private columnAt(clientX: number): string | null {
    const columns = this.host.nativeElement.querySelectorAll<HTMLElement>('.week-grid__column');
    for (const column of Array.from(columns)) {
      const rect = column.getBoundingClientRect();
      if (clientX >= rect.left && clientX < rect.right) {
        return column.dataset['date'] ?? null;
      }
    }
    return null;
  }
}

/** Créneaux et séances d'une journée, sous une forme commune à la mise en colonnes. */
function itemsOf(day: WeekDay): GridItem[] {
  const slots: GridItem[] = day.slots.map((slot) => ({
    id: slot.id,
    startTime: slot.startTime,
    endTime: slot.endTime,
    kind: 'slot',
    slot,
  }));
  const sessions: GridItem[] = day.sessions.map((session) => ({
    id: `${session.id}@${session.date}`,
    startTime: session.startTime,
    endTime: endOf(session),
    kind: 'session',
    session,
  }));
  return [...slots, ...sessions];
}

/** Fin d'une séance : début plus durée, bornée à 23:59. */
function endOf(session: SessionOccurrence): string {
  const [hours = 0, minutes = 0] = session.startTime.split(':').map(Number);
  return minutesToTime(hours * MINUTES_PER_HOUR + minutes + session.durationMinutes);
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

function isOnBlock(event: PointerEvent): boolean {
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
