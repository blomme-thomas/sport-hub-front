import { addIsoDays } from '../../../shared/utils/iso-date';
import type {
  CreateSlotRequestApi,
  SlotApi,
  SlotOccurrenceApi,
  UpdateSlotRequestApi,
} from '../models/slot.api-model';
import type { Slot, SlotInput } from '../models/slot.model';

const MINUTES_PER_HOUR = 60;
/** Dernière minute acceptée par le back pour une heure de fin (23:59). */
const LAST_MINUTE_OF_DAY = 23 * MINUTES_PER_HOUR + 59;

/** Position d'un créneau dans sa journée : minutes depuis minuit, colonne (`lane`) parmi `laneCount` en cas de chevauchement. */
export interface PositionedSlot {
  slot: Slot;
  startMinutes: number;
  endMinutes: number;
  lane: number;
  laneCount: number;
}

/** Occurrence de `GET /api/slots` en modèle UI ; l'identifiant est celui du créneau (`slotId`). */
export function toSlot(api: SlotOccurrenceApi): Slot {
  return {
    id: api.slotId,
    type: api.type,
    date: api.date,
    startTime: api.startTime,
    endTime: api.endTime,
    recurrence: api.recurrence,
  };
}

/** Créneau renvoyé par une écriture en modèle UI. */
export function toSavedSlot(api: SlotApi): Slot {
  return {
    id: api.id,
    type: api.type,
    date: api.date,
    startTime: api.startTime,
    endTime: api.endTime,
    recurrence: api.recurrence,
  };
}

/** Corps de création. Le fuseau est informatif côté back : le navigateur le fournit. */
export function toCreateRequest(input: SlotInput, timeZone: string): CreateSlotRequestApi {
  return {
    type: input.type,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    recurrence: input.recurrence,
    timeZone,
  };
}

/** Corps de modification : les champs du formulaire, sans fuseau (il reste inchangé côté back). */
export function toUpdateRequest(input: SlotInput): UpdateSlotRequestApi {
  return {
    type: input.type,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    recurrence: input.recurrence,
  };
}

/** Lundi de la semaine ISO qui contient la date `YYYY-MM-DD`. */
export function mondayOf(iso: string): string {
  const weekday = new Date(`${iso}T00:00:00Z`).getUTCDay();
  const offsetFromMonday = (weekday + 6) % 7;
  return addIsoDays(iso, -offsetFromMonday);
}

/** Les sept dates `YYYY-MM-DD` à partir d'un lundi. */
export function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, index) => addIsoDays(monday, index));
}

/** `HH:mm` vers minutes depuis minuit. */
export function timeToMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

/**
 * Minutes depuis minuit vers `HH:mm`. Bornée à 23:59, car le back refuse une fin à 24:00.
 */
export function minutesToTime(totalMinutes: number): string {
  const bounded = Math.min(Math.max(totalMinutes, 0), LAST_MINUTE_OF_DAY);
  const hours = Math.floor(bounded / MINUTES_PER_HOUR);
  const minutes = bounded % MINUTES_PER_HOUR;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Répartit les créneaux d'une journée en colonnes : deux créneaux qui se chevauchent sont côte à côte,
 * sans en masquer aucun. Chaque groupe de créneaux liés partage le même nombre de colonnes.
 */
export function layoutDaySlots(slots: readonly Slot[]): PositionedSlot[] {
  const sorted = slots
    .map((slot) => ({
      slot,
      startMinutes: timeToMinutes(slot.startTime),
      endMinutes: timeToMinutes(slot.endTime),
    }))
    .sort(
      (a, b) =>
        a.startMinutes - b.startMinutes ||
        b.endMinutes - a.endMinutes ||
        a.slot.id.localeCompare(b.slot.id),
    );

  const result: PositionedSlot[] = [];
  let group: PositionedSlot[] = [];
  let groupEnd = 0;
  let laneEnds: number[] = [];

  const closeGroup = (): void => {
    for (const item of group) {
      item.laneCount = laneEnds.length;
    }
    result.push(...group);
    group = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (group.length > 0 && item.startMinutes >= groupEnd) {
      closeGroup();
    }
    let lane = laneEnds.findIndex((end) => end <= item.startMinutes);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMinutes);
    } else {
      laneEnds[lane] = item.endMinutes;
    }
    group.push({ ...item, lane, laneCount: 0 });
    groupEnd = Math.max(groupEnd, item.endMinutes);
  }
  closeGroup();

  return result;
}
