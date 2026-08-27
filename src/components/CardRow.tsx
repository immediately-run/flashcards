import { useState } from 'react';
import type { Card, Progress } from '../lib/types';
import { intervalLabel, isLearned } from '../lib/sm2';
import CardForm, { type CardDraft } from './CardForm';
import RichText from './RichText';

interface Props {
  card: Card;
  progress?: Progress;
  editable: boolean;
  onSave: (draft: CardDraft) => Promise<void>;
  onDelete: () => Promise<void>;
}

function status(p?: Progress): string {
  if (!p) return 'new';
  if (isLearned(p)) return `learned · ${intervalLabel(p.interval)}`;
  return `learning · ${intervalLabel(p.interval)}`;
}

function CardRow({ card, progress, editable, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <li className="card-row editing">
        <CardForm
          initial={card}
          submitLabel="Save"
          onSubmit={async (d) => {
            await onSave(d);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="card-row">
      <div className="card-row-text">
        <RichText className="front" text={card.front} />
        <RichText className="back" text={card.back} />
      </div>
      <div className="card-row-meta">
        {card.tags.map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
        <span className={`status mono ${progress ? '' : 'is-new'}`}>{status(progress)}</span>
      </div>
      {editable && (
        <div className="card-row-actions">
          {confirming ? (
            <>
              <button type="button" className="btn btn-danger" onClick={() => void onDelete()}>
                Delete
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                Keep
              </button>
            </>
          ) : (
            <>
              <button type="button" className="icon-btn" aria-label="Edit card" onClick={() => setEditing(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
              <button type="button" className="icon-btn" aria-label="Delete card" onClick={() => setConfirming(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export default CardRow;
