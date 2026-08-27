import { useCallback, useEffect, useState } from 'react';
import type { Card } from '../lib/types';
import { cardsDir, listCards } from '../lib/deckStore';
import { pollDir } from '../lib/store';

/** Cards of one deck. With `poll`, the cards dir is polled every 3 s so
 *  co-editors' additions show up while a shared deck is open. */
export function useDeckCards(root: string | null, deckId: string, poll = false) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!root) return;
    setCards(await listCards(root, deckId));
    setLoading(false);
  }, [root, deckId]);

  useEffect(() => {
    if (!root) return;
    let alive = true;
    void listCards(root, deckId).then((c) => {
      if (!alive) return;
      setCards(c);
      setLoading(false);
    });
    const stop = poll ? pollDir(cardsDir(root, deckId), () => void reload(), 3000) : undefined;
    return () => {
      alive = false;
      stop?.();
    };
  }, [root, deckId, poll, reload]);

  return { cards, loading, reload, setCards };
}
