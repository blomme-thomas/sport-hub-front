import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core';

/**
 * Donne le rôle `combobox` au champ de recherche interne d'un `nz-select`, que ng-zorro ne renseigne pas.
 * Le champ garde le libellé porté par `<label for>` associé à `nzId`.
 */
@Directive({
  selector: 'nz-select[shSelectCombobox]',
})
export class SelectComboboxDirective implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  ngAfterViewInit(): void {
    this.host.nativeElement.querySelector('input')?.setAttribute('role', 'combobox');
  }
}
