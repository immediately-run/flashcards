// Root component — immediately.run renders the default export of THIS file.
// Global CSS is imported here (not in main.tsx) because immediately.run's
// runtime never loads main.tsx; anything the rendered tree needs must be
// reachable from App.tsx.
import './index.css';
import './App.css';
import { useCallback, useEffect, useState } from 'react';
import { useAppBoot } from './hooks/useAppBoot';
import type { Source } from './lib/types';
import { readDeck } from './lib/deckStore';
import TopBar from './components/TopBar';
import HomeScreen from './components/HomeScreen';
import DeckScreen from './components/DeckScreen';
import StudyScreen from './components/StudyScreen';

type View =
  | { kind: 'home' }
  | { kind: 'deck'; source: Source; deckId: string }
  | { kind: 'study'; source: Source; deckId: string; from: 'home' | 'deck' };

function App() {
  const boot = useAppBoot();
  const [view, setView] = useState<View>({ kind: 'home' });
  const [studyName, setStudyName] = useState('Deck');

  const goHome = useCallback(() => setView({ kind: 'home' }), []);

  // Resolve the deck name for the study header (kept out of StudyScreen so it
  // needs no extra read on every queue change).
  useEffect(() => {
    if (view.kind !== 'study') return;
    const store = view.source === 'shared' ? boot.shared : boot.privateStore;
    if (!store) return;
    let alive = true;
    void readDeck(store.root, view.deckId).then((d) => alive && setStudyName(d?.name ?? 'Deck'));
    return () => {
      alive = false;
    };
  }, [view, boot.shared, boot.privateStore]);

  return (
    <div className="app">
      <TopBar onHome={goHome} who={boot.who} />
      {boot.error && (
        <p className="banner" role="alert">
          {boot.error}
          <button type="button" className="linkish" onClick={boot.clearError}>
            dismiss
          </button>
        </p>
      )}
      {!boot.ready ? (
        <p className="hint">Opening your decks…</p>
      ) : view.kind === 'home' ? (
        <HomeScreen
          boot={boot}
          onOpenDeck={(source, deckId) => setView({ kind: 'deck', source, deckId })}
          onStudyDeck={(source, deckId) => setView({ kind: 'study', source, deckId, from: 'home' })}
        />
      ) : view.kind === 'deck' ? (
        <DeckScreen
          key={`${view.source}:${view.deckId}`}
          boot={boot}
          source={view.source}
          deckId={view.deckId}
          onBack={goHome}
          onStudy={() => setView({ kind: 'study', source: view.source, deckId: view.deckId, from: 'deck' })}
        />
      ) : (
        <StudyScreen
          key={`${view.source}:${view.deckId}`}
          boot={boot}
          source={view.source}
          deckId={view.deckId}
          deckName={studyName}
          onExit={() => (view.from === 'deck' ? setView({ kind: 'deck', source: view.source, deckId: view.deckId }) : goHome())}
        />
      )}
    </div>
  );
}

export default App;
