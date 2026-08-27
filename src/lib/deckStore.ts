// Deck + card records on top of a Store (private or shared). One file per record.
import fs from 'fs';
import type { Card, Deck, DeckSummary } from './types';
import { ensureDir, listFiles, readJson, removeFile, writeJson } from './store';

const join = (...p: string[]) => p.join('/').replace(/\/+/g, '/');

export const decksDir = (root: string) => join(root, 'decks');
export const deckDir = (root: string, deckId: string) => join(root, 'decks', deckId);
export const cardsDir = (root: string, deckId: string) => join(root, 'decks', deckId, 'cards');
const deckFile = (root: string, deckId: string) => join(deckDir(root, deckId), 'deck.json');
const cardFile = (root: string, deckId: string, cardId: string) =>
  join(cardsDir(root, deckId), `${cardId}.json`);

async function listDirs(dir: string): Promise<string[]> {
  try {
    const names = await fs.promises.readdir(dir);
    const dirs: string[] = [];
    for (const n of names) {
      if (n.startsWith('.')) continue;
      try {
        if ((await fs.promises.stat(join(dir, n))).isDirectory()) dirs.push(n);
      } catch {
        /* vanished between readdir and stat */
      }
    }
    return dirs;
  } catch {
    return [];
  }
}

export async function readDeck(root: string, deckId: string): Promise<Deck | null> {
  return readJson<Deck | null>(deckFile(root, deckId), null);
}

export async function writeDeck(root: string, deck: Deck): Promise<void> {
  await ensureDir(cardsDir(root, deck.id));
  await writeJson(deckFile(root, deck.id), deck);
}

export async function listDecks(root: string): Promise<DeckSummary[]> {
  const ids = await listDirs(decksDir(root));
  const decks = await Promise.all(
    ids.map(async (id) => {
      const deck = await readDeck(root, id);
      if (!deck) return null;
      const cardCount = (await listFiles(cardsDir(root, id), '.json')).length;
      return { ...deck, id, cardCount } satisfies DeckSummary;
    }),
  );
  return decks
    .filter((d): d is DeckSummary => d !== null)
    .sort((a, b) => a.created - b.created);
}

export async function listCards(root: string, deckId: string): Promise<Card[]> {
  const names = await listFiles(cardsDir(root, deckId), '.json');
  const cards = await Promise.all(
    names.map((n) => readJson<Card | null>(join(cardsDir(root, deckId), n), null)),
  );
  return cards.filter((c): c is Card => c !== null).sort((a, b) => a.created - b.created);
}

export async function writeCard(root: string, deckId: string, card: Card): Promise<void> {
  await writeJson(cardFile(root, deckId, card.id), card);
}

export async function deleteCard(root: string, deckId: string, cardId: string): Promise<void> {
  await removeFile(cardFile(root, deckId, cardId));
}

/** Remove a directory tree file by file (portable across the fs surfaces we run on). */
export async function removeTree(dir: string): Promise<void> {
  let names: string[] = [];
  try {
    names = await fs.promises.readdir(dir);
  } catch {
    return;
  }
  for (const n of names) {
    const p = join(dir, n);
    let isDir = false;
    try {
      isDir = (await fs.promises.stat(p)).isDirectory();
    } catch {
      continue;
    }
    if (isDir) await removeTree(p);
    else await removeFile(p);
  }
  try {
    await fs.promises.rmdir(dir);
  } catch {
    /* already gone or not empty on a racing writer */
  }
}

export async function deleteDeck(root: string, deckId: string): Promise<void> {
  await removeTree(deckDir(root, deckId));
}

/** Copy a deck (same id, all cards) into another store — used to publish to a space. */
export async function copyDeck(fromRoot: string, toRoot: string, deckId: string): Promise<number> {
  const deck = await readDeck(fromRoot, deckId);
  if (!deck) throw new Error('Deck not found');
  const cards = await listCards(fromRoot, deckId);
  await writeDeck(toRoot, deck);
  for (const c of cards) await writeCard(toRoot, deckId, c);
  return cards.length;
}
