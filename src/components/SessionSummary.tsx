import { useState } from 'react';
import type { SessionSummary as Summary } from '../lib/session';

interface Props {
  summary: Summary;
  remainingNew: number;
  onAgain: () => void;
  onCram: () => void;
  onDone: () => void;
  nothingToStudy: boolean;
}

function SessionSummary({ summary, remainingNew, onAgain, onCram, onDone, nothingToStudy }: Props) {
  const [now] = useState(() => Date.now());
  const mins = Math.max(1, Math.round((now - summary.startedAt) / 60000));
  const total = Object.values(summary.answers).reduce((a, b) => a + b, 0);
  const rows: Array<[string, number, string]> = [
    ['again', summary.answers.again, 'g-again'],
    ['hard', summary.answers.hard, 'g-hard'],
    ['good', summary.answers.good, 'g-good'],
    ['easy', summary.answers.easy, 'g-easy'],
  ];
  return (
    <div className="summary">
      {nothingToStudy ? (
        <>
          <h2>
            All caught up<span className="grad-text">.</span>
          </h2>
          <p className="lede">
            Nothing is due right now{remainingNew === 0 ? ' and today’s new-card budget is used up' : ''}. Come back
            tomorrow, or cram the whole deck.
          </p>
        </>
      ) : (
        <>
          <h2>
            Session done<span className="grad-text">.</span>
          </h2>
          <p className="lede">
            {summary.studied} {summary.studied === 1 ? 'card' : 'cards'} · {total} {total === 1 ? 'answer' : 'answers'} ·{' '}
            {mins} min
          </p>
          <div className="summary-grid">
            {rows.map(([label, n, cls]) => (
              <div key={label} className={`stat ${cls}`}>
                <span className="n">{n}</span>
                <span className="l mono">{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="row">
        {!nothingToStudy && (
          <button type="button" className="btn btn-primary" onClick={onAgain}>
            Study what’s due
          </button>
        )}
        <button type="button" className={`btn ${nothingToStudy ? 'btn-primary' : 'btn-ghost'}`} onClick={onCram}>
          Cram all cards
        </button>
        <button type="button" className="btn btn-ghost" onClick={onDone}>
          Back to deck
        </button>
      </div>
    </div>
  );
}

export default SessionSummary;
