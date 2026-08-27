import { useCallback, useEffect, useState } from 'react';
import type { DeckSummary } from '../lib/types';
import { decksDir, listDecks } from '../lib/deckStore';
import { pollDir } from '../lib/store';

/** Decks under a store root. With `poll`, re-lists when the decks dir changes
 *  (shared spaces have no remote watch events). */
export function useDeckList(root: string | null, poll = false) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!root) return;
    setDecks(await listDecks(root));
    setLoading(false);
  }, [root]);

  useEffect(() => {
    if (!root) return;
    let alive = true;
    void listDecks(root).then((d) => {
      if (!alive) return;
      setDecks(d);
      setLoading(false);
    });
    const stop = poll ? pollDir(decksDir(root), () => void reload(), 3000) : undefined;
    return () => {
      alive = false;
      stop?.();
    };
  }, [root, poll, reload]);

  return { decks, loading, reload };
}
