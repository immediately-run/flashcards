// Per-user review progress. ALWAYS lives in the private store, keyed by deckId,
// so studying a shared deck never writes into the shared space.
import type { Progress } from './types';
import { listFiles, readJson, writeJson } from './store';

const join = (...p: string[]) => p.join('/').replace(/\/+/g, '/');

export const progressDir = (privateRoot: string, deckId: string) =>
  join(privateRoot, 'progress', deckId);

export type ProgressMap = Record<string, Progress>;

export async function loadProgress(privateRoot: string, deckId: string): Promise<ProgressMap> {
  const dir = progressDir(privateRoot, deckId);
  const names = await listFiles(dir, '.json');
  const map: ProgressMap = {};
  await Promise.all(
    names.map(async (n) => {
      const p = await readJson<Progress | null>(join(dir, n), null);
      if (p) map[n.slice(0, -'.json'.length)] = p;
    }),
  );
  return map;
}

export async function saveProgress(
  privateRoot: string,
  deckId: string,
  cardId: string,
  p: Progress,
): Promise<void> {
  await writeJson(join(progressDir(privateRoot, deckId), `${cardId}.json`), p);
}
