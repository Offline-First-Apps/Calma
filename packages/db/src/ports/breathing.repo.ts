import type { BreathingSession } from '@calma/domain';

export type NewBreathingSession = Omit<BreathingSession, 'id'>;

export interface BreathingStats {
  sessions: number;
  totalSeconds: number;
  /**
   * Mean pre-session distress, or `null` if nobody rated. A skipped rating is
   * absent, never zero — treating "I'd rather not say" as "completely calm"
   * would quietly flatter every average in the app (D-007).
   */
  averagePreSuds: number | null;
  improvedCount: number;
}

export interface BreathingRepo {
  create(input: NewBreathingSession): Promise<BreathingSession>;
  get(id: string): Promise<BreathingSession | null>;
  listByDay(dayKey: string): Promise<BreathingSession[]>;
  listDays(limit?: number): Promise<string[]>;
  statsForDays(dayKeys: readonly string[]): Promise<BreathingStats>;
  delete(id: string): Promise<void>;
}
