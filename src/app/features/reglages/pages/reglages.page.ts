import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { NzButtonComponent } from 'ng-zorro-antd/button';
import { TEXTS, fill } from '@shared/texts/texts';
import { toHoursMinutes, toTotalSeconds } from '../data-access/weekly-target.format';
import { UserSettingsState } from '../data-access/user-settings.state';

const MAX_HOURS = 99;
const MAX_MINUTES = 59;
const INVALID_MESSAGE = TEXTS.reglages.weeklyTarget.invalid;

@Component({
  selector: 'sh-reglages-page',
  imports: [NzButtonComponent],
  templateUrl: './reglages.page.html',
  styleUrl: './reglages.page.scss',
  providers: [UserSettingsState],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReglagesPage {
  protected readonly state = inject(UserSettingsState);
  protected readonly t = TEXTS;
  protected readonly maxHours = MAX_HOURS;
  protected readonly maxMinutes = MAX_MINUTES;

  /** Champs du formulaire : repartent de la cible enregistrée à chaque changement de celle-ci. */
  protected readonly hours = linkedSignal(
    () => toHoursMinutes(this.state.weeklyTargetSeconds() ?? 0).hours,
  );
  protected readonly minutes = linkedSignal(
    () => toHoursMinutes(this.state.weeklyTargetSeconds() ?? 0).minutes,
  );

  protected readonly totalSeconds = computed(() =>
    toTotalSeconds({ hours: this.hours(), minutes: this.minutes() }),
  );
  protected readonly invalid = computed(
    () =>
      this.totalSeconds() <= 0 ||
      this.minutes() > MAX_MINUTES ||
      this.minutes() < 0 ||
      this.hours() < 0 ||
      this.hours() > MAX_HOURS,
  );
  protected readonly invalidMessage = INVALID_MESSAGE;

  /** Cible enregistrée lisible, « 8h 00 », ou null. */
  protected readonly currentLabel = computed(() => {
    const seconds = this.state.weeklyTargetSeconds();
    if (seconds === null) {
      return null;
    }
    const { hours, minutes } = toHoursMinutes(seconds);
    return fill(TEXTS.reglages.weeklyTarget.format, {
      hours,
      minutes: String(minutes).padStart(2, '0'),
    });
  });

  protected readonly touched = signal(false);

  protected onHours(event: Event): void {
    this.hours.set(readNumber(event));
  }

  protected onMinutes(event: Event): void {
    this.minutes.set(readNumber(event));
  }

  protected submit(): void {
    this.touched.set(true);
    if (this.invalid()) {
      return;
    }
    void this.state.save(this.totalSeconds());
  }

  protected clear(): void {
    this.touched.set(false);
    void this.state.save(null);
  }
}

function readNumber(event: Event): number {
  const value = Number.parseInt((event.target as HTMLInputElement).value, 10);
  return Number.isNaN(value) ? 0 : value;
}
