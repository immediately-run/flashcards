import { useCallback, useEffect, useState } from 'react';
import type { Progress } from '../lib/types';
import { loadProgress, saveProgress, type ProgressMap } from '../lib/progressStore';

interface Loaded {
  key: string;
  map: ProgressMap;
}

/** This user's SM-2 state for a deck — always read from / written to the PRIVATE store. */
export function useDeckProgress(privateRoot: string | null, deckId: string) {
  const key = `${privateRoot ?? ''}::${deckId}`;
  const [state, setState] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!privateRoot) return;
    let alive = true;
    void loadProgress(privateRoot, deckId).then((map) => {
      if (alive) setState({ key, map });
    });
    return () => {
      alive = false;
    };
  }, [privateRoot, deckId, key]);

  const loaded = state?.key === key;
  const progress: ProgressMap = loaded ? state.map : {};

  const record = useCallback(
    async (cardId: string, p: Progress) => {
      setState((s) => ({ key, map: { ...(s?.key === key ? s.map : {}), [cardId]: p } }));
      if (privateRoot) await saveProgress(privateRoot, deckId, cardId, p);
    },
    [privateRoot, deckId, key],
  );

  return { progress, loaded, record };
}
