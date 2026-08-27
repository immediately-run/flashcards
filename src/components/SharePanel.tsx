import type { Store } from '../lib/store';
import type { ShareHow } from '../hooks/useAppBoot';

interface Props {
  shared: Store | null;
  busy: boolean;
  onOpen: (how: ShareHow) => void;
  onForget: () => void;
}

function SharePanel({ shared, busy, onOpen, onForget }: Props) {
  if (shared) {
    return (
      <div className="share-panel">
        <p className="share-line">
          Connected to <b>{shared.name || 'a shared space'}</b>
          <span className="chip">{shared.mode === 'rw' ? 'can edit' : 'read only'}</span>
        </p>
        <p className="hint">
          Invite classmates from the platform's Spaces UI — the app cannot invite people. Their decks appear here
          within a few seconds.
        </p>
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={() => onOpen('pick')} disabled={busy}>
            Switch space
          </button>
          <button type="button" className="btn btn-ghost" onClick={onForget} disabled={busy}>
            Disconnect
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="share-panel">
      <p className="share-line">Decks in a shared space can be studied and edited by everyone in it.</p>
      <p className="hint">
        Pick a space you belong to, or create one for this class. Share the space itself from the platform's
        Spaces UI.
      </p>
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={() => onOpen('pick')} disabled={busy}>
          Open shared decks
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => onOpen('create')} disabled={busy}>
          Create a class space
        </button>
      </div>
    </div>
  );
}

export default SharePanel;
