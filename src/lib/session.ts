// Study-queue construction and deck statistics (pure functions).
import type { Card, Grade } from './types';
import type { ProgressMap } from './progressStore';
import { isDue, isLearned, startOfDay } from './sm2';

export interface DeckStats {
  total: number;
  dueToday: number;
  learned: number;
  fresh: number;
  learning: number;
  /** New cards already introduced today (counts against the daily budget). */
  newToday: number;
}

export function deckStats(cards: Card[], progress: ProgressMap, now: number): DeckStats {
  const s: DeckStats = { total: cards.length, dueToday: 0, learned: 0, fresh: 0, learning: 0, newToday: 0 };
  const today = startOfDay(now);
  for (const c of cards) {
    const p = progress[c.id];
    if (!p) {
      s.fresh += 1;
      continue;
    }
    if (isLearned(p)) s.learned += 1;
    else s.learning += 1;
    if (isDue(p, now)) s.dueToday += 1;
    if (startOfDay(p.firstSeen) === today) s.newToday += 1;
  }
  return s;
}

/** Due cards first (oldest due first), then new cards up to today's remaining budget. */
export function buildQueue(cards: Card[], progress: ProgressMap, newPerDay: number, now: number): Card[] {
  const { newToday } = deckStats(cards, progress, now);
  const due = cards
    .filter((c) => progress[c.id] && isDue(progress[c.id], now))
    .sort((a, b) => progress[a.id].due - progress[b.id].due);
  const fresh = cards
    .filter((c) => !progress[c.id])
    .sort((a, b) => a.created - b.created)
    .slice(0, Math.max(0, newPerDay - newToday));
  return [...due, ...fresh];
}

export interface SessionSummary {
  /** Distinct cards seen. */
  studied: number;
  answers: Record<Grade, number>;
  startedAt: number;
}

export const emptySummary = (now: number): SessionSummary => ({
  studied: 0,
  answers: { again: 0, hard: 0, good: 0, easy: 0 },
  startedAt: now,
});

/** Where a forgotten card re-enters the queue: a few cards later, or at the end. */
export const REQUEUE_AFTER = 3;
