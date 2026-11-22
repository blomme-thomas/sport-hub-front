export type SlotTypeApi = 'libre' | 'occupe';

export type SlotRecurrenceApi = 'aucune' | 'hebdomadaire';

/** Créneau tel que renvoyé par les écritures `POST` et `PATCH /api/slots` (forme JSON du back). */
export interface SlotApi {
  id: string;
  type: SlotTypeApi;
  /** Date `YYYY-MM-DD` ; pour une série hebdomadaire, jour d'ancrage. */
  date: string;
  /** Heure murale `HH:mm`. */
  startTime: string;
  endTime: string;
  recurrence: SlotRecurrenceApi;
  timeZone: string;
}

/** Occurrence d'un créneau sur un jour de la période, telle que renvoyée par `GET /api/slots`. */
export interface SlotOccurrenceApi {
  /** Identifiant du créneau (et de sa série) ; c'est lui qu'on modifie ou supprime. */
  slotId: string;
  type: SlotTypeApi;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: SlotRecurrenceApi;
  timeZone: string;
}

export interface SlotOccurrencesResponseApi {
  from: string;
  to: string;
  items: SlotOccurrenceApi[];
}

export interface CreateSlotRequestApi {
  type: SlotTypeApi;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: SlotRecurrenceApi;
  timeZone: string;
}

/** Champs absents = inchangés. Le front envoie toujours les champs visibles dans le formulaire. */
export interface UpdateSlotRequestApi {
  type: SlotTypeApi;
  date: string;
  startTime: string;
  endTime: string;
  recurrence: SlotRecurrenceApi;
}
