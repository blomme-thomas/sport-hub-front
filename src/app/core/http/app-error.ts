/** Erreur HTTP normalisée par l'intercepteur d'erreur. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
