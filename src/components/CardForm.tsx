import { useState } from 'react';
import { parseTags } from '../lib/importExport';

export interface CardDraft {
  front: string;
  back: string;
  tags: string[];
}

interface Props {
  initial?: CardDraft;
  submitLabel: string;
  onSubmit: (draft: CardDraft) => Promise<void> | void;
  onCancel: () => void;
}

function CardForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [front, setFront] = useState(initial?.front ?? '');
  const [back, setBack] = useState(initial?.back ?? '');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [busy, setBusy] = useState(false);
  const valid = front.trim().length > 0 && back.trim().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await onSubmit({ front: front.trim(), back: back.trim(), tags: parseTags(tags) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card-form" onSubmit={submit}>
      <label>
        Front
        <textarea value={front} onChange={(e) => setFront(e.target.value)} rows={2} placeholder="Question or prompt" autoFocus />
      </label>
      <label>
        Back
        <textarea value={back} onChange={(e) => setBack(e.target.value)} rows={2} placeholder="Answer" />
      </label>
      <label>
        Tags
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="comma, separated" />
      </label>
      <p className="hint">
        <code>**bold**</code>, <code>*emphasis*</code> and line breaks are rendered on the card.
      </p>
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={!valid || busy}>
          {submitLabel}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default CardForm;
