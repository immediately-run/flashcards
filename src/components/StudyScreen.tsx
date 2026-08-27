import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppBoot } from '../hooks/useAppBoot';
import { useDeckCards } from '../hooks/useDeckCards';
import { useDeckProgress } from '../hooks/useDeckProgress';
import type { Card, Grade, Source } from '../lib/types';
import { applyGrade, intervalLabel, newProgress, nextInterval } from '../lib/sm2';
import { REQUEUE_AFTER, buildQueue, deckStats, emptySummary, type SessionSummary as Summary } from '../lib/session';
import FlipCard from './FlipCard';
import SessionSummary from './SessionSummary';

interface Props {
  boot: AppBoot;
  source: Source;
  deckId: string;
  deckName: string;
  onExit: () => void;
}

interface Session {
  queue: Card[];
  initialSize: number;
  seen: string[];
  summary: Summary;
}

const GRADES: Array<{ g: Grade; label: string; key: string }> = [
  { g: 'again', label: 'Again', key: '1' },
  { g: 'hard', label: 'Hard', key: '2' },
  { g: 'good', label: 'Good', key: '3' },
  { g: 'easy', label: 'Easy', key: '4' },
];

const makeSession = (queue: Card[], now: number): Session => ({
  queue,
  initialSize: queue.length,
  seen: [],
  summary: emptySummary(now),
});

function StudyScreen({ boot, source, deckId, deckName, onExit }: Props) {
  const store = source === 'shared' ? boot.shared : boot.privateStore;
  const { cards, loading } = useDeckCards(store?.root ?? null, deckId);
  const { progress, loaded, record } = useDeckProgress(boot.privateStore?.root ?? null, deckId);
  // Mount time — the reference "now" for due checks and the initial queue.
  const [startedAt] = useState(() => Date.now());

  // The first session is derived once cards + progress have loaded; grading and
  // restarts replace it with explicit state.
  const [override, setOverride] = useState<Session | null>(null);
  const initial = useMemo<Session | null>(() => {
    if (loading || !loaded) return null;
    return makeSession(buildQueue(cards, progress, boot.config.newPerDay, startedAt), startedAt);
    // Only the initial session is derived here; later cards/progress changes must
    // not rebuild a session that is under way.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loaded]);
  const [flipped, setFlipped] = useState(false);
  const session = override ?? initial;

  const restart = useCallback(
    (cram: boolean) => {
      const now = Date.now();
      const q = cram ? [...cards] : buildQueue(cards, progress, boot.config.newPerDay, now);
      setFlipped(false);
      setOverride(makeSession(q, now));
    },
    [cards, progress, boot.config.newPerDay],
  );

  const current = session && session.queue.length > 0 ? session.queue[0] : null;
  const currentProgress = useMemo(
    () => (current ? (progress[current.id] ?? newProgress(startedAt)) : null),
    [current, progress, startedAt],
  );

  const grade = useCallback(
    (g: Grade) => {
      if (!current || !currentProgress || !session) return;
      const now = Date.now();
      void record(current.id, applyGrade(currentProgress, g, now));
      const rest = session.queue.slice(1);
      if (g === 'again') rest.splice(Math.min(REQUEUE_AFTER, rest.length), 0, current);
      const seen = session.seen.includes(current.id) ? session.seen : [...session.seen, current.id];
      setFlipped(false);
      setOverride({
        ...session,
        queue: rest,
        seen,
        summary: {
          ...session.summary,
          studied: seen.length,
          answers: { ...session.summary.answers, [g]: session.summary.answers[g] + 1 },
        },
      });
    },
    [current, currentProgress, session, record],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!flipped) setFlipped(true);
        else grade('good');
        return;
      }
      if (e.key === 'Escape') {
        onExit();
        return;
      }
      const hit = GRADES.find((x) => x.key === e.key);
      if (hit && flipped) {
        e.preventDefault();
        grade(hit.g);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, flipped, grade, onExit]);

  if (!store) {
    return (
      <div className="study">
        <p className="hint">This deck's space is no longer open.</p>
        <button type="button" className="btn btn-ghost" onClick={onExit}>
          Back
        </button>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="study">
        <p className="hint">Preparing your session…</p>
      </div>
    );
  }

  if (!current || !currentProgress) {
    const st = deckStats(cards, progress, startedAt);
    return (
      <div className="study">
        <SessionSummary
          summary={session.summary}
          nothingToStudy={session.initialSize === 0}
          remainingNew={Math.max(0, boot.config.newPerDay - st.newToday)}
          onAgain={() => restart(false)}
          onCram={() => restart(true)}
          onDone={onExit}
        />
      </div>
    );
  }

  const remaining = session.queue.length;
  const done = Math.max(0, session.initialSize - remaining);
  const extra = Math.max(0, remaining - (session.initialSize - done));
  return (
    <div className="study">
      <div className="study-head">
        <button type="button" className="linkish" onClick={onExit}>
          ← {deckName}
        </button>
        <span className="mono progress-label">
          {done} / {session.initialSize}
          {extra > 0 ? ` (+${extra} again)` : ''}
        </span>
      </div>
      <div className="progress-bar" aria-hidden="true">
        <span style={{ width: `${session.initialSize ? (done / session.initialSize) * 100 : 0}%` }} />
      </div>

      <FlipCard key={current.id} front={current.front} back={current.back} flipped={flipped} onFlip={() => setFlipped(true)} />

      <div className="study-controls">
        {!flipped ? (
          <button type="button" className="btn btn-primary btn-big reveal" onClick={() => setFlipped(true)}>
            Show answer <kbd>space</kbd>
          </button>
        ) : (
          <div className="grades">
            {GRADES.map(({ g, label, key }) => (
              <button key={g} type="button" className={`grade g-${g}`} onClick={() => grade(g)}>
                <span className="grade-label">{label}</span>
                <span className="grade-when mono">{intervalLabel(nextInterval(currentProgress, g))}</span>
                <kbd>{key}</kbd>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudyScreen;
