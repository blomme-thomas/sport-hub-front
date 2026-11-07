import type { AbstractControl, FormGroup } from '@angular/forms';
import type { AppError } from './app-error';

/**
 * Pose l'erreur `server` sur chaque contrôle visé par `fieldErrors`, messages d'un même champ joints, et le marque `touched`.
 *
 * @returns les messages sans contrôle correspondant, à afficher par l'écran
 */
export function applyFieldErrors(form: FormGroup, error: AppError): string[] {
  const messagesByControl = new Map<AbstractControl, string[]>();
  const orphans: string[] = [];

  for (const fieldError of error.fieldErrors) {
    const control = form.get(toControlPath(fieldError.field));
    if (control === null) {
      orphans.push(fieldError.message);
      continue;
    }
    messagesByControl.set(control, [...(messagesByControl.get(control) ?? []), fieldError.message]);
  }

  for (const [control, messages] of messagesByControl) {
    control.setErrors({ server: messages.join(' ') });
    control.markAsTouched();
  }

  return orphans;
}

/** Convertit un chemin de l'API (`items[0].name`) en chemin de `form.get()` (`items.0.name`). */
export function toControlPath(field: string): string {
  return field.replace(/\[(\d+)\]/g, '.$1').replace(/^\./, '');
}
