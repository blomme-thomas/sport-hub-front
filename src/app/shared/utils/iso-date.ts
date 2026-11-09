const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Date locale du jour (`YYYY-MM-DD`), calculée avec le fuseau du navigateur.
 * `toISOString` n'est pas utilisé : il renverrait le jour UTC.
 */
export function localIsoDate(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Convertit une date `YYYY-MM-DD` en `Date` locale à minuit. */
export function isoDateToDate(iso: string | null): Date | null {
  if (iso === null) {
    return null;
  }
  return new Date(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));
}

/** Convertit une `Date` en `YYYY-MM-DD` avec les champs locaux. */
export function dateToIsoDate(date: Date | null): string | null {
  return date === null ? null : localIsoDate(date);
}

/**
 * Ajoute `days` jours calendaires à une date `YYYY-MM-DD`, sans effet de fuseau ni d'heure d'été
 * (calcul en UTC sur la date seule).
 */
export function addIsoDays(iso: string, days: number): string {
  const time = Date.parse(`${iso}T00:00:00Z`) + days * MS_PER_DAY;
  return new Date(time).toISOString().slice(0, 10);
}
