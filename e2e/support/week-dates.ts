import { localIsoDate } from '../../src/app/shared/utils/iso-date';
import { addIsoDays } from '../../src/app/shared/utils/iso-date';
import { isoWeekOf, mondayOfIsoWeek } from '../../src/app/shared/utils/iso-week';

/**
 * Date `YYYY-MM-DD` d'un jour de la semaine ISO courante (0 = lundi, 6 = dimanche), en date locale.
 * Les tests de calendrier affichent la semaine du jour : leurs données doivent tomber dans cette semaine,
 * quel que soit le jour d'exécution (une date figée sort de la semaine affichée et casse la CI).
 */
export function currentWeekDay(offset: number): string {
  return addIsoDays(mondayOfIsoWeek(isoWeekOf(localIsoDate())), offset);
}
