import { useEffect, useMemo, useState } from 'react';
import type { AppBoot } from '../hooks/useAppBoot';
import { useDeckCards } from '../hooks/useDeckCards';
import { useDeckProgress } from '../hooks/useDeckProgress';
import type { Card, Deck, Source } from '../lib/types';
import { copyDeck, deleteCard, deleteDeck, readDeck, writeCard, writeDeck } from '../lib/deckStore';
import { formatExport, type ImportedCard } from '../lib/importExport';
import { deckStats } from '../lib/session';
import { newId } from '../lib/store';
import CardForm, { type CardDraft } from './CardForm';
import CardRow from './CardRow';
import ExportPanel from './ExportPanel';
import ImportPanel from './ImportPanel';
import StatBar from './StatBar';

interface Props {
  boot: AppBoot;
  source: Source;
  deckId: string;
  onBack: () => void;
  onStudy: () => void;
}

type Panel = 'none' | 'add' | 'import' | 'export' | 'details' | 'delete';

function DeckScreen({ boot, source, deckId, onBack, onStudy }: Props) {
  const store = source === 'shared' ? boot.shared : boot.privateStore;
  const root = store?.root ?? null;
  const editable = store?.mode === 'rw';
  const { cards, reload, setCards } = useDeckCards(root, deckId, source === 'shared');
  const { progress } = useDeckProgress(boot.privateStore?.root ?? null, deckId);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [panel, setPanel] = useState<Panel>('none');
  const [note, setNote] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!root) return;
    let alive = true;
    void readDeck(root, deckId).then((d) => {
      if (!alive) return;
      setDeck(d);
      setName(d?.name ?? '');
      setDescription(d?.description ?? '');
    });
    return () => {
      alive = false;
    };
  }, [root, deckId]);

  const stats = useMemo(() => deckStats(cards, progress, now), [cards, progress, now]);

  if (!store) {
    return (
      <div className="deck">
        <button type="button" className="linkish" onClick={onBack}>
          ← All decks
        </button>
        <p className="hint">This deck's space is no longer open.</p>
      </div>
    );
  }
  if (!deck) {
    return (
      <div className="deck">
        <button type="button" className="linkish" onClick={onBack}>
          ← All decks
        </button>
        <p className="hint">Loading…</p>
      </div>
    );
  }

  const addCard = async (d: CardDraft) => {
    const card: Card = { id: newId(), ...d, created: Date.now() };
    await writeCard(store.root, deckId, card);
    setCards((cs) => [...cs, card]);
  };
  const saveCard = async (card: Card, d: CardDraft) => {
    const next = { ...card, ...d };
    await writeCard(store.root, deckId, next);
    setCards((cs) => cs.map((c) => (c.id === card.id ? next : c)));
  };
  const removeCard = async (card: Card) => {
    await deleteCard(store.root, deckId, card.id);
    setCards((cs) => cs.filter((c) => c.id !== card.id));
  };
  const importCards = async (rows: ImportedCard[]) => {
    const t = Date.now();
    const added: Card[] = rows.map((r, i) => ({ id: newId(), ...r, created: t + i }));
    for (const c of added) await writeCard(store.root, deckId, c);
    setCards((cs) => [...cs, ...added]);
    setNote(`Imported ${added.length} ${added.length === 1 ? 'card' : 'cards'}.`);
  };
  const saveDetails = async () => {
    const next = { ...deck, name: name.trim() || deck.name, description: description.trim() };
    await writeDeck(store.root, next);
    setDeck(next);
    setPanel('none');
  };
  const publish = async () => {
    let target = boot.shared;
    if (!target) target = await boot.openShared('pick');
    if (!target) return;
    if (target.mode !== 'rw') {
      setNote(`You can only read "${target.name || 'that space'}" — ask its owner for edit access to publish.`);
      return;
    }
    const n = await copyDeck(store.root, target.root, deckId);
    setNote(`Published "${deck.name}" (${n} ${n === 1 ? 'card' : 'cards'}) to ${target.name || 'the shared space'}.`);
  };
  const destroy = async () => {
    await deleteDeck(store.root, deckId);
    onBack();
  };

  return (
    <div className="deck">
      <button type="button" className="linkish" onClick={onBack}>
        ← All decks
      </button>
      <div className="deck-head">
        <div>
          <h1>{deck.name}</h1>
          {deck.description && <p className="lede">{deck.description}</p>}
          <p className="hint mono">
            by {deck.by} · {source === 'shared' ? `shared in ${store.name || 'a space'}` : 'private'}
            {!editable && ' · read only'}
          </p>
        </div>
        <button type="button" className="btn btn-primary btn-big" onClick={onStudy} disabled={cards.length === 0}>
          Study {stats.dueToday + Math.min(stats.fresh, Math.max(0, boot.config.newPerDay - stats.newToday)) > 0 ? `(${stats.dueToday + Math.min(stats.fresh, Math.max(0, boot.config.newPerDay - stats.newToday))})` : ''}
        </button>
      </div>

      <StatBar stats={stats} />

      <div className="toolbar">
        {editable && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPanel(panel === 'add' ? 'none' : 'add')}>
              + Add card
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPanel(panel === 'import' ? 'none' : 'import')}>
              Import
            </button>
          </>
        )}
        <button type="button" className="btn btn-ghost" onClick={() => setPanel(panel === 'export' ? 'none' : 'export')} disabled={cards.length === 0}>
          Export
        </button>
        {source === 'private' && (
          <button type="button" className="btn btn-ghost" onClick={() => void publish()} disabled={boot.sharedBusy || cards.length === 0}>
            Publish to a space
          </button>
        )}
        {editable && (
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPanel(panel === 'details' ? 'none' : 'details')}>
              Edit details
            </button>
            <button type="button" className="btn btn-ghost danger" onClick={() => setPanel(panel === 'delete' ? 'none' : 'delete')}>
              Delete deck
            </button>
          </>
        )}
        {source === 'shared' && (
          <button type="button" className="btn btn-ghost" onClick={() => void reload()}>
            Refresh
          </button>
        )}
      </div>

      {note && (
        <p className="note" onClick={() => setNote(null)}>
          {note} <span className="mono">✕</span>
        </p>
      )}

      {panel === 'add' && (
        <div className="panel">
          <CardForm
            submitLabel="Add card"
            onSubmit={async (d) => {
              await addCard(d);
              setNote('Card added.');
            }}
            onCancel={() => setPanel('none')}
          />
        </div>
      )}
      {panel === 'import' && <ImportPanel onImport={importCards} onClose={() => setPanel('none')} />}
      {panel === 'export' && <ExportPanel text={formatExport(cards)} onClose={() => setPanel('none')} />}
      {panel === 'details' && (
        <form
          className="panel form"
          onSubmit={(e) => {
            e.preventDefault();
            void saveDetails();
          }}
        >
          <h3>Deck details.</h3>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="row">
            <button type="submit" className="btn btn-primary">
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPanel('none')}>
              Cancel
            </button>
          </div>
        </form>
      )}
      {panel === 'delete' && (
        <div className="panel form">
          <h3>Delete this deck?</h3>
          <p className="hint">
            Removes the deck and its {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            {source === 'shared' ? ' for everyone in the space' : ''}. Your review history stays private and is kept.
          </p>
          <div className="row">
            <button type="button" className="btn btn-danger" onClick={() => void destroy()}>
              Delete deck
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setPanel('none')}>
              Keep
            </button>
          </div>
        </div>
      )}

      <ul className="cardlist">
        {cards.map((c) => (
          <CardRow
            key={c.id}
            card={c}
            progress={progress[c.id]}
            editable={editable}
            onSave={(d) => saveCard(c, d)}
            onDelete={() => removeCard(c)}
          />
        ))}
      </ul>
      {cards.length === 0 && <p className="hint">No cards yet. Add one, or import a list.</p>}
    </div>
  );
}

export default DeckScreen;
