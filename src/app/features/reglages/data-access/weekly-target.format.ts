const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;

export interface HoursMinutes {
  hours: number;
  minutes: number;
}

/** Découpe une durée en secondes en heures et minutes entières (les secondes sont ignorées). */
export function toHoursMinutes(totalSeconds: number): HoursMinutes {
  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  const minutes = Math.floor((totalSeconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  return { hours, minutes };
}

/** Durée totale en secondes pour des heures et des minutes saisies. */
export function toTotalSeconds({ hours, minutes }: HoursMinutes): number {
  return hours * SECONDS_PER_HOUR + minutes * SECONDS_PER_MINUTE;
}
