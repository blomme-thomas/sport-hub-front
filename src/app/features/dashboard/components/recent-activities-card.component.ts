import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { IconComponent } from '@shared/ui/icon/icon.component';
import type { AppError } from '../../../core/http/app-error';
import { RecentActivityRowComponent } from './recent-activity-row.component';
import type { RecentActivity } from '../models/recent-activity.model';

@Component({
  selector: 'sh-recent-activities-card',
  imports: [NzButtonComponent, IconComponent, RecentActivityRowComponent],
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
  /** Une séance a été cliquée : son identifiant, pour ouvrir le détail. */
  readonly opened = output<string>();
}
