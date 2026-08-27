import type { DeckSummary, Source } from '../lib/types';

interface Props {
  deck: DeckSummary;
  source: Source;
  onOpen: () => void;
  onStudy: () => void;
}

function DeckTile({ deck, source, onOpen, onStudy }: Props) {
  return (
    <article className="tile">
      <div className="tile-head">
        <h3>{deck.name}</h3>
        {source === 'shared' && <span className="chip">shared</span>}
      </div>
      {deck.description && <p className="tile-desc">{deck.description}</p>}
      <p className="tile-meta mono">
        {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'} · by {deck.by}
      </p>
      <div className="tile-actions">
        <button type="button" className="btn btn-primary" onClick={onStudy} disabled={deck.cardCount === 0}>
          Study
        </button>
        <button type="button" className="btn btn-ghost" onClick={onOpen}>
          Open →
        </button>
      </div>
    </article>
  );
}

export default DeckTile;
