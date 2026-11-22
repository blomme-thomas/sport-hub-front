// Squelette — à copier dans shared/pipes/<name>.pipe.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/02-components.instructions.md
//
// Pipe pur : mise en forme d'affichage uniquement, aucune dépendance de données.

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'shDuration' })
export class DurationPipe implements PipeTransform {
  transform(totalSeconds: number | null | undefined): string {
    if (totalSeconds == null) return '–';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
  }
}
