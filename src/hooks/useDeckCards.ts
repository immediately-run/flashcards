import { useCallback, useEffect, useState } from 'react';
import type { Card } from '../lib/types';
import { cardsDir, listCards } from '../lib/deckStore';
import { watchDir } from '../lib/store';

/** Cards of one deck. With `watch`, the cards dir is watched (R3-901 — the relay covers remote writes) so
 *  co-editors' additions show up while a shared deck is open. */
export function useDeckCards(root: string | null, deckId: string, watch = false) {
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
    const stop = watch ? watchDir(cardsDir(root, deckId), () => void reload()) : undefined;
    return () => {
      alive = false;
      stop?.();
    };
  }, [root, deckId, watch, reload]);

  return { cards, loading, reload, setCards };
}
