import type { SlotApi } from '../../app/features/creneaux/models/slot.api-model';

/** Lundi de la semaine de référence des fixtures (9 au 15 novembre 2026). */
export const WEEK_MONDAY = '2026-11-09';

export const libreMardiApi: SlotApi = {
  id: 'slot-libre-mardi',
  type: 'libre',
  date: '2026-11-10',
  startTime: '09:00',
  endTime: '10:30',
  recurrence: 'aucune',
  timeZone: 'Europe/Paris',
};

/** Créneau hebdomadaire ancré un lundi antérieur : il apparaît chaque lundi à partir de son ancrage. */
export const occupeLundiHebdoApi: SlotApi = {
  id: 'slot-occupe-lundi',
  type: 'occupe',
  date: '2026-11-02',
  startTime: '18:00',
  endTime: '19:00',
  recurrence: 'hebdomadaire',
  timeZone: 'Europe/Paris',
};

/** Créneau qui chevauche le précédent : les deux doivent être affichés. */
export const libreChevaucheApi: SlotApi = {
  id: 'slot-libre-chevauche',
  type: 'libre',
  date: '2026-11-10',
  startTime: '10:00',
  endTime: '11:00',
  recurrence: 'aucune',
  timeZone: 'Europe/Paris',
};

export const slotsFixtures: SlotApi[] = [libreMardiApi, occupeLundiHebdoApi, libreChevaucheApi];
