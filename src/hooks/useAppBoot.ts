// Boot sequence: open the private store FIRST, load config, seed the sample deck
// on first run, then silently re-open a remembered shared space (no prompt).
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@immediately-run/sdk/auth';
import type { Store } from '../lib/store';
import {
  createSharedStore,
  openPrivateStore,
  openRememberedSpace,
  pickSharedStore,
  readJson,
  writeJson,
} from '../lib/store';
import type { AppConfig } from '../lib/types';
import { listDecks, writeCard, writeDeck } from '../lib/deckStore';
import { SEED_CARDS, SEED_DECK } from '../data/seedDeck';

const DEFAULT_CONFIG: AppConfig = { newPerDay: 20 };
const configPath = (root: string) => `${root}/config.json`;

export type ShareHow = 'pick' | 'create';

export interface AppBoot {
  ready: boolean;
  error: string | null;
  clearError: () => void;
  privateStore: Store | null;
  config: AppConfig;
  updateConfig: (patch: Partial<AppConfig>) => Promise<void>;
  /** Currently open shared space, if any. */
  shared: Store | null;
  sharedBusy: boolean;
  /** Ask the host for a space (powerbox pick or create). Resolves null when declined. */
  openShared: (how: ShareHow) => Promise<Store | null>;
  /** Forget the remembered space (does not revoke the grant — that is host UI). */
  forgetShared: () => Promise<void>;
  /** Display name of the current user, for the `by` field. */
  who: string;
}

const describe = (e: unknown): string => {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') return e.message;
  return String(e);
};
const isCancelled = (e: unknown): boolean =>
  !!e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'cancelled';

export function useAppBoot(): AppBoot {
  const auth = useAuth();
  const who = auth.user?.login?.trim() || 'someone';

  const [privateStore, setPrivateStore] = useState<Store | null>(null);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [shared, setShared] = useState<Store | null>(null);
  const [sharedBusy, setSharedBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Runs twice under StrictMode; every step is idempotent (fixed seed ids), so the
    // superseded run simply stops publishing state.
    let alive = true;
    (async () => {
      try {
        const priv = await openPrivateStore('data');
        const cfg = { ...DEFAULT_CONFIG, ...(await readJson<Partial<AppConfig>>(configPath(priv.root), {})) };
        if (!cfg.seeded && priv.mode === 'rw' && (await listDecks(priv.root)).length === 0) {
          await writeDeck(priv.root, SEED_DECK);
          for (const c of SEED_CARDS) await writeCard(priv.root, SEED_DECK.id, c);
          cfg.seeded = true;
          await writeJson(configPath(priv.root), cfg);
        }
        if (!alive) return;
        setPrivateStore(priv);
        setConfig(cfg);
        if (cfg.spaceId) {
          const s = await openRememberedSpace(cfg.spaceId);
          if (alive && s) setShared(s);
        }
      } catch (e) {
        if (alive) setError(`Could not open your flashcards storage: ${describe(e)}`);
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const updateConfig = useCallback(
    async (patch: Partial<AppConfig>) => {
      if (!privateStore) return;
      const next = { ...config, ...patch };
      setConfig(next);
      try {
        await writeJson(configPath(privateStore.root), next);
      } catch (e) {
        setError(`Could not save settings: ${describe(e)}`);
      }
    },
    [config, privateStore],
  );

  const openShared = useCallback(
    async (how: ShareHow): Promise<Store | null> => {
      setSharedBusy(true);
      try {
        const s = how === 'create' ? await createSharedStore('Flashcards') : await pickSharedStore();
        setShared(s);
        if (s.spaceId) await updateConfig({ spaceId: s.spaceId });
        return s;
      } catch (e) {
        if (!isCancelled(e)) setError(`Could not open a shared space: ${describe(e)}`);
        return null;
      } finally {
        setSharedBusy(false);
      }
    },
    [updateConfig],
  );

  const forgetShared = useCallback(async () => {
    setShared(null);
    await updateConfig({ spaceId: undefined });
  }, [updateConfig]);

  return {
    ready,
    error,
    clearError: () => setError(null),
    privateStore,
    config,
    updateConfig,
    shared,
    sharedBusy,
    openShared,
    forgetShared,
    who,
  };
}
