// Squelette — à copier dans shared/directives/<name>.directive.ts puis adapter.
// Exclu du build/lint/test (voir instructions/11, section "Templates de code").
// Référence : instructions/02-components.instructions.md

import { Directive, input } from '@angular/core';

@Directive({
  selector: '[shHighlight]',
  host: {
    '[class.highlighted]': 'shHighlight()', // host: {} à la place de @HostBinding
  },
})
export class HighlightDirective {
  readonly shHighlight = input(false);
}
