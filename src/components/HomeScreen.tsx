import { useState } from 'react';
import type { AppBoot } from '../hooks/useAppBoot';
import { useDeckList } from '../hooks/useDeckList';
import type { Source } from '../lib/types';
import { newId } from '../lib/store';
import { writeDeck } from '../lib/deckStore';
import DeckTile from './DeckTile';
import NewDeckForm from './NewDeckForm';
import SharePanel from './SharePanel';

interface Props {
  boot: AppBoot;
  onOpenDeck: (source: Source, deckId: string) => void;
  onStudyDeck: (source: Source, deckId: string) => void;
}

function HomeScreen({ boot, onOpenDeck, onStudyDeck }: Props) {
  const { privateStore, shared, config, updateConfig } = boot;
  const mine = useDeckList(privateStore?.root ?? null);
  const theirs = useDeckList(shared?.root ?? null, true);
  const [creating, setCreating] = useState<Source | null>(null);
  // Draft so the name is written once on blur/Enter, not per keystroke.
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const commitName = () => {
    if (nameDraft === null) return;
    const next = nameDraft.trim();
    setNameDraft(null);
    if (next !== (config.displayName ?? '')) void updateConfig({ displayName: next || undefined });
  };

  const createDeck = async (source: Source, name: string, description: string) => {
    const root = source === 'shared' ? shared?.root : privateStore?.root;
    if (!root) return;
    const id = newId();
    await writeDeck(root, { id, name, description, created: Date.now(), by: boot.who });
    setCreating(null);
    onOpenDeck(source, id);
  };

  return (
    <div className="home">
      <section className="hero-row">
        <div>
          <h1>
            Remember <span className="grad-text">everything.</span>
          </h1>
          <p className="lede">Spaced repetition, one card at a time. Decks are folders you can share with a class.</p>
        </div>
        <div className="settings">
          <label className="setting">
            <span className="mono">Your name</span>
            <input
              type="text"
              maxLength={40}
              placeholder={boot.who}
              value={nameDraft ?? config.displayName ?? ''}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              disabled={!privateStore || privateStore.mode !== 'rw'}
            />
          </label>
          <label className="setting">
            <span className="mono">New cards / day</span>
            <input
              type="number"
              min={0}
              max={500}
              value={config.newPerDay}
              onChange={(e) => void updateConfig({ newPerDay: Math.max(0, Math.min(500, Number(e.target.value) || 0)) })}
            />
          </label>
        </div>
      </section>

      <section>
        <div className="sechead">
          <h2>Your decks.</h2>
          <button type="button" className="btn btn-primary" onClick={() => setCreating('private')} disabled={!privateStore || privateStore.mode !== 'rw'}>
            + New deck
          </button>
        </div>
        {creating === 'private' && (
          <NewDeckForm onCreate={(n, d) => createDeck('private', n, d)} onCancel={() => setCreating(null)} />
        )}
        {mine.loading ? (
          <p className="hint">Loading…</p>
        ) : mine.decks.length === 0 ? (
          <p className="hint">No decks yet — create one, or import cards into a new deck.</p>
        ) : (
          <div className="tiles">
            {mine.decks.map((d) => (
              <DeckTile key={d.id} deck={d} source="private" onOpen={() => onOpenDeck('private', d.id)} onStudy={() => onStudyDeck('private', d.id)} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="sechead">
          <h2>Shared decks.</h2>
          {shared && shared.mode === 'rw' && (
            <button type="button" className="btn btn-ghost" onClick={() => setCreating('shared')}>
              + New shared deck
            </button>
          )}
        </div>
        <SharePanel shared={shared} busy={boot.sharedBusy} onOpen={(how) => void boot.openShared(how)} onForget={() => void boot.forgetShared()} />
        {creating === 'shared' && (
          <NewDeckForm onCreate={(n, d) => createDeck('shared', n, d)} onCancel={() => setCreating(null)} />
        )}
        {shared && !theirs.loading && theirs.decks.length === 0 && (
          <p className="hint">This space has no decks yet. Publish one of yours from its deck page.</p>
        )}
        {shared && theirs.decks.length > 0 && (
          <div className="tiles">
            {theirs.decks.map((d) => (
              <DeckTile key={d.id} deck={d} source="shared" onOpen={() => onOpenDeck('shared', d.id)} onStudy={() => onStudyDeck('shared', d.id)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default HomeScreen;
