import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import type { AppError } from '../../../core/http/app-error';
import type { RecentActivity } from '../models/recent-activity.model';

@Component({
  selector: 'sh-recent-activities-card',
  imports: [NzButtonComponent],
  templateUrl: './recent-activities-card.component.html',
  styleUrl: './recent-activities-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentActivitiesCardComponent {
  /** `undefined` tant que la liste n'est pas chargée, tableau vide s'il n'y a aucune séance. */
  readonly activities = input.required<RecentActivity[] | undefined>();
  readonly error = input<AppError | null>(null);
  readonly loading = input<boolean>(false);
  readonly retry = output<void>();
}
