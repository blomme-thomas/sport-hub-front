import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { EVENT_FORMATS, GOAL_TYPES } from '../models/goal-options';
import type { Goal, TargetTime } from '../models/goal.model';

interface GoalRow {
  goal: Goal;
  summary: string;
}

let nextListId = 0;

/** Liste d'objectifs d'une section, sans logique de chargement ; émet l'objectif choisi pour modification ou suppression. */
@Component({
  selector: 'sh-goal-list',
  imports: [NzButtonComponent],
  templateUrl: './goal-list.component.html',
  styleUrl: './goal-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalListComponent {
  readonly goals = input.required<readonly Goal[]>();
  readonly heading = input.required<string>();
  readonly emptyMessage = input.required<string>();

  readonly edit = output<Goal>();
  readonly delete = output<Goal>();

  protected readonly headingId = `goal-list-heading-${++nextListId}`;

  protected readonly rows = computed<GoalRow[]>(() =>
    this.goals().map((goal) => ({ goal, summary: summarize(goal) })),
  );
}

function summarize(goal: Goal): string {
  const parts = [
    GOAL_TYPES.find((option) => option.value === goal.type)?.label,
    goal.eventFormat === null
      ? undefined
      : EVENT_FORMATS.find((option) => option.value === goal.eventFormat)?.label,
    goal.targetDate === null ? undefined : formatDay(goal.targetDate),
    goal.targetTime === null ? undefined : formatTime(goal.targetTime),
  ];
  return parts.filter((part): part is string => part !== undefined).join(' · ');
}

function formatDay(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

function formatTime({ hours, minutes, seconds }: TargetTime): string {
  return `${hours} h ${minutes} min ${seconds} s`;
}
