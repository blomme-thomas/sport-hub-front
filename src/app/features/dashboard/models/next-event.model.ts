export interface NextEvent {
  id: string;
  title: string;
  /** Date `YYYY-MM-DD`, sans heure ni fuseau. */
  targetDate: string;
  formatLabel: string | null;
  targetTimeLabel: string | null;
}
