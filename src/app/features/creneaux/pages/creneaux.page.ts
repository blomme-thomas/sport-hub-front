import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalComponent, NzModalContentDirective, NzModalService } from 'ng-zorro-antd/modal';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { addIsoDays, localIsoDate } from '../../../shared/utils/iso-date';
import { SlotFormComponent } from '../components/slot-form.component';
import { WeekGridComponent } from '../components/week-grid.component';
import { SlotsState } from '../data-access/slots.state';
import type { Slot, SlotDefaults, SlotInput } from '../models/slot.model';

const DEFAULT_START = '09:00';
const DEFAULT_END = '10:00';
const WEEK_LAST_OFFSET_DAYS = 6;

/** Écran des disponibilités : grille de la semaine, création par sélection, modification et suppression d'un créneau. */
@Component({
  selector: 'sh-creneaux-page',
  imports: [
    NzButtonComponent,
    NzModalComponent,
    NzModalContentDirective,
    SlotFormComponent,
    WeekGridComponent,
  ],
  templateUrl: './creneaux.page.html',
  styleUrl: './creneaux.page.scss',
  providers: [SlotsState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreneauxPage {
  protected readonly state = inject(SlotsState);

  private readonly modal = inject(NzModalService);
  private readonly messages = inject(NzMessageService);

  /** Créneau en cours de modification, `'new'` pour une création, `null` quand le formulaire est fermé. */
  protected readonly editing = signal<Slot | 'new' | null>(null);
  protected readonly formSlot = computed(() => {
    const target = this.editing();
    return target === null || target === 'new' ? null : target;
  });
  protected readonly formTitle = computed(() =>
    this.editing() === 'new' ? 'Nouveau créneau' : 'Modifier le créneau',
  );
  protected readonly formDefaults = signal<SlotDefaults>(defaultsFor(this.state.weekStart()));
  protected readonly formError = signal<AppError | null>(null);
  protected readonly weekLabel = computed(() =>
    formatWeek(this.state.weekStart(), this.state.weekEnd()),
  );

  /** Ouvre une création, pré-remplie avec la plage choisie dans la grille si elle est fournie. */
  protected openCreate(range?: SlotDefaults): void {
    this.formError.set(null);
    this.formDefaults.set(range ?? defaultsFor(this.state.weekStart()));
    this.editing.set('new');
  }

  protected openEdit(slot: Slot): void {
    this.formError.set(null);
    this.editing.set(slot);
  }

  protected closeForm(): void {
    this.editing.set(null);
    this.formError.set(null);
  }

  protected onSaved(input: SlotInput): void {
    void this.save(input);
  }

  protected confirmDelete(): void {
    const target = this.formSlot();
    if (target === null) {
      return;
    }
    this.modal.confirm({
      nzTitle: 'Supprimer ce créneau ?',
      nzContent:
        target.recurrence === 'hebdomadaire'
          ? 'La suppression efface toute la série, qui se répète chaque semaine.'
          : 'Cette action est définitive.',
      nzOkText: 'Supprimer',
      nzOkDanger: true,
      nzCancelText: 'Annuler',
      nzOnOk: () => this.remove(target),
    });
  }

  private async save(input: SlotInput): Promise<void> {
    const target = this.editing();
    if (target === null) {
      return;
    }

    this.formError.set(null);
    try {
      if (target === 'new') {
        await this.state.create(input);
      } else {
        await this.state.update(target.id, input);
      }
    } catch (error) {
      this.formError.set(error instanceof AppError ? error : toAppError(error));
      return;
    }

    this.closeForm();
    this.messages.success(target === 'new' ? 'Créneau créé.' : 'Créneau modifié.');
  }

  private async remove(slot: Slot): Promise<void> {
    try {
      await this.state.remove(slot.id);
    } catch (error) {
      this.formError.set(error instanceof AppError ? error : toAppError(error));
      return;
    }
    this.closeForm();
    this.messages.success('Créneau supprimé.');
  }
}

/** Valeurs par défaut : aujourd'hui si la semaine affichée le contient, sinon son premier jour. */
function defaultsFor(weekStart: string): SlotDefaults {
  const today = localIsoDate();
  const inWeek = today >= weekStart && today <= addIsoDays(weekStart, WEEK_LAST_OFFSET_DAYS);
  return { date: inWeek ? today : weekStart, startTime: DEFAULT_START, endTime: DEFAULT_END };
}

function formatWeek(start: string, end: string): string {
  const format = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `Semaine du ${format.format(new Date(`${start}T00:00:00Z`))} au ${format.format(new Date(`${end}T00:00:00Z`))}`;
}
