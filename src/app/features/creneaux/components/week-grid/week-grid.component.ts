import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  afterNextRender,
  untracked,
} from '@angular/core';
import { IconComponent, type IconName } from '@shared/ui/icon/icon.component';
import { layoutDaySlots, minutesToTime, timeToMinutes } from '../../data-access/slot.mapper';
import { disciplineStyleOf } from '@shared/ui/discipline/discipline-style';
import { slotTypeLabel } from '../../models/slot-options';
import type { SessionOccurrence } from '../../models/session-occurrence.model';
import type { Slot, SlotDefaults } from '../../models/slot.model';
import type { WeekDay } from '../../models/week-day.model';
import { fill, TEXTS } from '@shared/texts/texts';

/** Hauteur d'une heure dans la grille, en pixels : au maximum, et au minimum sur un petit écran. */
const PX_PER_HOUR_MAX = 72;
const PX_PER_HOUR_MIN = 30;
/** Espace laissé sous la grille et hauteur de la ligne des jours : la grille prend le reste de la fenêtre. */
const BOTTOM_MARGIN_PX = 48;
const DAY_HEADER_PX = 32;
/** Fin de la grille : la dernière case est 21:00–22:00 (la plage 22:00–24:00 n'est pas utilisée). */
const HOURS = 22;
const MINUTES_PER_HOUR = 60;
const DAY_MINUTES = HOURS * MINUTES_PER_HOUR;
/** Pas de la sélection et du déplacement à la souris, en minutes : le quart d'heure. */
const SNAP_MINUTES = 15;
/** Durée proposée par un simple clic sur une colonne. */
const DEFAULT_DURATION_MINUTES = SNAP_MINUTES;
/** Hauteur minimale d'un bloc, pour que son libellé reste lisible. */
const MIN_BLOCK_HEIGHT_PX = 20;
const BLOCK_GAP_PX = 2;
/** Première heure affichée par défaut : pas d'intérêt à montrer minuit à 7 h. */
const DEFAULT_FIRST_HOUR = 7;
/** Distance à partir de laquelle un appui devient un déplacement (et non un clic). */
const MOVE_THRESHOLD_PX = 5;
/** Délai au-delà duquel la carte lâchée reprend sa position, même si les données n'ont pas changé. */
const HOLD_TIMEOUT_MS = 3000;

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
  cancelled: boolean;
  /** Séance réalisée : ni déplacement, ni modification de la durée depuis la vignette. */
  done: boolean;
  /** Séance planifiée : la durée se modifie depuis la vignette. */
  editable: boolean;
  top: number;
  height: number;
  left: number;
  width: number;
  icon: IconName | null;
  color: string;
}

/** Zone dessinée dans une colonne : emplacement d'un déplacement, ou plage sélectionnée. */
interface PlacementPreview {
  date: string;
  top: number;
  height: number;
  label: string;
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
 * émet la séance ; glisser sur une colonne émet la plage choisie (pas d'un quart d'heure, un clic seul propose une heure).
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
  host: { '(window:resize)': 'onResize()' },
})
export class WeekGridComponent {
  protected readonly t = TEXTS;
  protected readonly fill = fill;
  readonly days = input.required<readonly WeekDay[]>();
  /** Libellés des disciplines, par clé. Une clé absente s'affiche telle quelle. */
  readonly labels = input<ReadonlyMap<string, string>>(new Map());

  readonly slotSelected = output<Slot>();
  readonly sessionSelected = output<SessionOccurrence>();
  readonly rangeSelected = output<SlotDefaults>();
  readonly moved = output<GridMove>();
  /** Demande de suppression depuis la corbeille de la vignette. */
  readonly sessionDeleteRequested = output<SessionOccurrence>();
  /** Annulation de cette occurrence, ou restauration si elle est déjà annulée (séances récurrentes). */
  readonly occurrenceToggled = output<SessionOccurrence>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Hauteur de la fenêtre, pour adapter la hauteur des heures au lieu de faire défiler la page. */
  /** Hauteur disponible sous le haut de la grille, mesurée dans la page. */
  private readonly availableHeight = signal(
    typeof window === 'undefined' ? 900 : window.innerHeight,
  );
  protected readonly measured = afterNextRender(() => this.measure());

  /** Première heure affichée : 06:00, ou plus tôt si une séance commence avant. */
  protected readonly firstHour = computed(() => firstHourOf(this.days()));
  /** Hauteur d'une heure en pixels : la grille tient dans la fenêtre, entre le minimum et le maximum. */
  protected readonly hourPx = computed(() =>
    Math.min(
      PX_PER_HOUR_MAX,
      Math.max(
        PX_PER_HOUR_MIN,
        Math.floor(
          (this.availableHeight() - DAY_HEADER_PX - BOTTOM_MARGIN_PX) / (HOURS - this.firstHour()),
        ),
      ),
    ),
  );
  /** Hauteur d'un quart d'heure : le pas du déplacement vertical. */
  private readonly snapPx = computed(() => (this.hourPx() * SNAP_MINUTES) / MINUTES_PER_HOUR);
  /** Décalage de la grille en minutes depuis minuit (la première heure affichée). */
  private readonly offsetMinutes = computed(() => this.firstHour() * MINUTES_PER_HOUR);

  onResize(): void {
    this.measure();
  }

  /** Mesure l'espace entre le haut de la grille et le bas de la fenêtre : la grille le remplit. */
  private measure(): void {
    const top = this.host.nativeElement.getBoundingClientRect().top;
    this.availableHeight.set(window.innerHeight - top);
  }

  protected readonly gridHeight = computed(() => (HOURS - this.firstHour()) * this.hourPx());
  protected readonly hours = computed(() =>
    Array.from({ length: HOURS - this.firstHour() }, (_, index) => ({
      top: index * this.hourPx(),
      label: `${String(this.firstHour() + index).padStart(2, '0')}:00`,
    })),
  );

  private readonly drag = signal<DragState | null>(null);
  private move: MoveState | null = null;
  private suppressClick = false;
  /** Carte lâchée, gardée à sa position le temps que la grille se mette à jour. */
  private heldCard: HTMLElement | null = null;
  /** Dès que les données de la semaine changent, la carte lâchée reprend sa position normale (elle est alors à la bonne place). */
  protected readonly releaseOnNewData = effect(() => {
    this.days();
    untracked(() => this.releaseCard());
  });

  protected readonly columns = computed<GridColumn[]>(() =>
    this.days().map((day) => ({
      date: day.date,
      shortLabel: formatShortDay(day.date),
      longLabel: formatLongDay(day.date),
      blocks: layoutDaySlots(itemsOf(day)).map((positioned) => {
        const item = positioned.slot;
        const timeRange = `${minutesToTime(positioned.startMinutes)} – ${minutesToTime(positioned.endMinutes)}`;
        const geometry = {
          top:
            ((positioned.startMinutes - this.offsetMinutes()) * this.hourPx()) / MINUTES_PER_HOUR,
          height: Math.max(
            ((positioned.endMinutes - positioned.startMinutes) * this.hourPx()) / MINUTES_PER_HOUR -
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
            cancelled: false,
            done: false,
            editable: false,
            icon: null,
            color: '',
            ...geometry,
          };
        }
        const style = disciplineStyleOf(item.session.disciplineTypeKey);
        const disciplineLabel =
          this.labels().get(item.session.disciplineTypeKey) ?? item.session.disciplineTypeKey;
        const done = item.session.status === 'realisee';
        return {
          key: item.id,
          kind: 'session' as const,
          date: day.date,
          slot: null,
          session: item.session,
          label: done
            ? fill(TEXTS.creneaux.session.realizedLabel, {
                discipline: disciplineLabel,
                time: timeRange,
              })
            : fill(TEXTS.creneaux.session.label, { discipline: disciplineLabel, time: timeRange }),
          timeRange,
          movable: item.session.status !== 'annulee' && !done,
          cancelled: item.session.status === 'annulee',
          done,
          editable: item.session.status === 'planifiee',
          icon: style.icon,
          color: style.color,
          ...geometry,
        };
      }),
    })),
  );

  /** Emplacement où l'élément déplacé va se poser (jour, position, fin), pendant le glissement. */
  protected readonly movePreview = signal<PlacementPreview | null>(null);

  /** Ce qui est dessiné dans la colonne : l'emplacement d'un déplacement, sinon la plage en cours de sélection. */
  protected readonly ghost = computed<PlacementPreview | null>(
    () => this.movePreview() ?? this.preview(),
  );

  /** Plage en cours de sélection, dessinée dans la colonne concernée. */
  protected readonly preview = computed<PlacementPreview | null>(() => {
    const current = this.drag();
    if (current === null) {
      return null;
    }
    const { start, end } = rangeOf(current);
    return {
      date: current.date,
      top: ((start - this.offsetMinutes()) * this.hourPx()) / MINUTES_PER_HOUR,
      height: ((end - start) * this.hourPx()) / MINUTES_PER_HOUR,
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
    const slot = event.currentTarget as HTMLElement;
    slot.setPointerCapture(event.pointerId);
    // La carte entière (vignette et actions) suit le glissement : on déplace l'élément parent.
    const element = slot.closest<HTMLElement>('.week-grid__item') ?? slot;
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
    // Le déplacement vertical avance par quart d'heure : la carte et son emplacement restent alignés.
    const snappedY = Math.round(deltaY / this.snapPx()) * this.snapPx();
    move.deltaY = snappedY;
    move.element.style.transform = `translate(${deltaX}px, ${snappedY}px)`;
    move.element.style.zIndex = '2';
    this.movePreview.set(this.placementOf(move.block, event.clientX, snappedY));
  }

  /** Emplacement où la carte se poserait : jour sous le pointeur, heure de début décalée et fin calculée. */
  /** Garde la carte lâchée à sa place visuelle ; elle est libérée quand les données de la semaine changent (ou après un délai). */
  private holdCard(element: HTMLElement): void {
    this.releaseCard();
    this.heldCard = element;
    setTimeout(() => {
      if (this.heldCard === element) {
        this.releaseCard();
      }
    }, HOLD_TIMEOUT_MS);
  }

  private releaseCard(): void {
    if (this.heldCard !== null) {
      this.heldCard.style.transform = '';
      this.heldCard.style.zIndex = '';
      this.heldCard = null;
    }
  }

  private placementOf(block: PositionedBlock, clientX: number, deltaY: number): PlacementPreview {
    const duration = block.endMinutes - block.startMinutes;
    const deltaMinutes = Math.round(deltaY / this.snapPx()) * SNAP_MINUTES;
    const start = Math.min(Math.max(block.startMinutes + deltaMinutes, 0), DAY_MINUTES - duration);
    return {
      date: this.columnAt(clientX) ?? block.date,
      top: ((start - this.offsetMinutes()) * this.hourPx()) / MINUTES_PER_HOUR,
      height: (duration * this.hourPx()) / MINUTES_PER_HOUR - BLOCK_GAP_PX,
      label: `${minutesToTime(start)} – ${minutesToTime(start + duration)}`,
    };
  }

  protected onBlockPointerUp(event: PointerEvent): void {
    const move = this.move;
    if (move === null || move.pointerId !== event.pointerId) {
      return;
    }
    this.move = null;
    this.movePreview.set(null);
    if (!move.moved) {
      move.element.style.transform = '';
      move.element.style.zIndex = '';
      return;
    }
    this.suppressClick = true;

    const block = move.block;
    const date = this.columnAt(event.clientX) ?? block.date;
    const duration = block.endMinutes - block.startMinutes;
    const deltaMinutes =
      Math.round((move.deltaY * MINUTES_PER_HOUR) / this.hourPx() / SNAP_MINUTES) * SNAP_MINUTES;
    const start = Math.min(Math.max(block.startMinutes + deltaMinutes, 0), DAY_MINUTES - duration);
    if (date === block.date && start === block.startMinutes) {
      move.element.style.transform = '';
      move.element.style.zIndex = '';
      return;
    }
    // La carte reste là où elle a été lâchée, jusqu'à ce que la grille soit mise à jour avec le nouvel emplacement.
    this.holdCard(move.element);
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

  protected onDeleteClick(block: PositionedBlock): void {
    if (block.session !== null) {
      this.sessionDeleteRequested.emit(block.session);
    }
  }

  protected onOccurrenceClick(block: PositionedBlock): void {
    if (block.session !== null) {
      this.occurrenceToggled.emit(block.session);
    }
  }

  protected onColumnPointerDown(event: PointerEvent, date: string): void {
    if (event.button !== 0 || isOnBlock(event)) {
      return;
    }
    const column = event.currentTarget as HTMLElement;
    column.setPointerCapture(event.pointerId);
    const minutes = minutesAt(event, column, this.offsetMinutes(), this.hourPx());
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
    const minutes = minutesAt(
      event,
      event.currentTarget as HTMLElement,
      this.offsetMinutes(),
      this.hourPx(),
    );
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
function minutesAt(
  event: PointerEvent,
  column: HTMLElement,
  offset: number,
  pxPerHour: number,
): number {
  const rect = column.getBoundingClientRect();
  const minutes = ((event.clientY - rect.top) * MINUTES_PER_HOUR) / pxPerHour + offset;
  const snapped = Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
  return Math.min(Math.max(snapped, 0), DAY_MINUTES);
}

function isOnBlock(event: PointerEvent): boolean {
  return event.target instanceof Element && event.target.closest('.week-grid__item') !== null;
}

function describeSlot(slot: Slot, timeRange: string): string {
  const recurrence = slot.recurrence === 'hebdomadaire' ? TEXTS.creneaux.grid.recurrenceSuffix : '';
  return fill(TEXTS.creneaux.grid.slotEdit, {
    type: slotTypeLabel(slot.type),
    range: timeRange,
    recurrence,
  });
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

/** Première heure affichée : 06:00, ou plus tôt si un élément de la semaine commence avant. */
function firstHourOf(days: readonly WeekDay[]): number {
  const earliest = days.flatMap((day) => [
    ...day.sessions.map((session) => timeToMinutes(session.startTime)),
    ...day.slots.map((slot) => timeToMinutes(slot.startTime)),
  ]);
  const firstHour = Math.min(
    DEFAULT_FIRST_HOUR,
    ...earliest.map((minutes) => Math.floor(minutes / MINUTES_PER_HOUR)),
  );
  return Math.max(0, firstHour);
}
