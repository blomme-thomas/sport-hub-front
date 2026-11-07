import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalComponent, NzModalContentDirective, NzModalService } from 'ng-zorro-antd/modal';
import { AppError } from '../../../core/http/app-error';
import { toAppError } from '../../../core/http/problem-details.mapper';
import { GoalFormComponent } from '../components/goal-form.component';
import { GoalListComponent } from '../components/goal-list.component';
import { GoalsState } from '../data-access/goals.state';
import type { Goal, GoalInput } from '../models/goal.model';

/** Écran des objectifs : sections à venir, passés et sans date, création, modification et suppression. */
@Component({
  selector: 'sh-goals-page',
  imports: [
    NzButtonComponent,
    NzModalComponent,
    NzModalContentDirective,
    GoalFormComponent,
    GoalListComponent,
  ],
  templateUrl: './goals.page.html',
  styleUrl: './goals.page.scss',
  providers: [GoalsState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalsPage {
  protected readonly state = inject(GoalsState);

  private readonly modal = inject(NzModalService);
  private readonly messages = inject(NzMessageService);

  /** Objectif en cours de modification, `'new'` pour une création, `null` quand le formulaire est fermé. */
  protected readonly editing = signal<Goal | 'new' | null>(null);
  protected readonly formGoal = computed(() => {
    const target = this.editing();
    return target === null || target === 'new' ? null : target;
  });
  protected readonly formTitle = computed(() =>
    this.editing() === 'new' ? 'Nouvel objectif' : 'Modifier l’objectif',
  );
  protected readonly formError = signal<AppError | null>(null);

  protected openForm(target: Goal | 'new'): void {
    this.formError.set(null);
    this.editing.set(target);
  }

  protected closeForm(): void {
    this.editing.set(null);
    this.formError.set(null);
  }

  protected onSaved(input: GoalInput): void {
    void this.save(input);
  }

  protected confirmDelete(goal: Goal): void {
    this.modal.confirm({
      nzTitle: 'Supprimer cet objectif ?',
      nzContent: 'Cette action est définitive.',
      nzOkText: 'Supprimer',
      nzOkDanger: true,
      nzCancelText: 'Annuler',
      nzOnOk: () => this.remove(goal),
    });
  }

  private async save(input: GoalInput): Promise<void> {
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
    this.messages.success(target === 'new' ? 'Objectif créé.' : 'Objectif modifié.');
  }

  private async remove(goal: Goal): Promise<void> {
    try {
      await this.state.remove(goal.id);
    } catch {
      return;
    }
    this.messages.success('Objectif supprimé.');
  }
}
