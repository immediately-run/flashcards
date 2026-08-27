// SM-2 scheduling (SuperMemo 2, as popularised by Anki), simplified to four grades.
import type { Grade, Progress } from './types';

export const DAY = 86_400_000;
export const MIN_EASE = 1.3;
/** Interval (days) from which a card counts as "learned". */
export const MATURE_DAYS = 21;

export const startOfDay = (t: number): number => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
export const endOfDay = (t: number): number => startOfDay(t) + DAY - 1;

export const newProgress = (now: number): Progress => ({
  ease: 2.5,
  interval: 0,
  due: now,
  reps: 0,
  lapses: 0,
  firstSeen: now,
});

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Next interval in days for a grade (0 = show again in this session). */
export function nextInterval(p: Progress, g: Grade): number {
  const { interval, reps, ease } = p;
  switch (g) {
    case 'again':
      return 0;
    case 'hard':
      return reps === 0 ? 1 : Math.max(interval + 1, Math.round(interval * 1.2));
    case 'good':
      return reps === 0 ? 1 : reps === 1 ? 6 : Math.max(interval + 1, Math.round(interval * ease));
    case 'easy':
      return reps === 0 ? 4 : Math.max(interval + 2, Math.round(interval * ease * 1.3));
  }
}

export function applyGrade(p: Progress, g: Grade, now: number): Progress {
  const interval = nextInterval(p, g);
  if (g === 'again') {
    return {
      ...p,
      ease: round2(Math.max(MIN_EASE, p.ease - 0.2)),
      interval: 0,
      reps: 0,
      lapses: p.lapses + 1,
      due: now,
    };
  }
  const ease = g === 'hard' ? p.ease - 0.15 : g === 'easy' ? p.ease + 0.15 : p.ease;
  return {
    ...p,
    ease: round2(Math.max(MIN_EASE, ease)),
    interval,
    reps: p.reps + 1,
    due: startOfDay(now) + interval * DAY,
  };
}

/** Short label for the interval a grade would give ("now", "1d", "6d", "2mo"). */
export function intervalLabel(days: number): string {
  if (days <= 0) return 'now';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1).replace(/\.0$/, '')}y`;
}

export const isDue = (p: Progress, now: number): boolean => p.due <= endOfDay(now);
export const isLearned = (p: Progress): boolean => p.interval >= MATURE_DAYS;
