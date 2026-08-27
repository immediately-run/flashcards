// Domain types. Storage layout (one record = one file, see store.ts):
//   <store>/decks/<deckId>/deck.json
//   <store>/decks/<deckId>/cards/<cardId>.json
//   <private>/progress/<deckId>/<cardId>.json   (always private, even for shared decks)
//   <private>/config.json

export interface Deck {
  id: string;
  name: string;
  description: string;
  created: number;
  /** Login of whoever created the deck ("someone" when the host has no login). */
  by: string;
}

export interface DeckSummary extends Deck {
  cardCount: number;
}

export interface Card {
  id: string;
  front: string;
  back: string;
  tags: string[];
  created: number;
}

/** SM-2 state for one card, for one user. */
export interface Progress {
  /** Easiness factor, >= 1.3. */
  ease: number;
  /** Current inter-repetition interval in days (0 = relearning now). */
  interval: number;
  /** Epoch ms when the card is next due. */
  due: number;
  /** Consecutive successful repetitions. */
  reps: number;
  /** Times the card was forgotten ("again"). */
  lapses: number;
  /** Epoch ms of the first review — used for the new-cards-per-day budget. */
  firstSeen: number;
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

/** Where a deck lives: the user's private store or the currently open shared space. */
export type Source = 'private' | 'shared';

export interface AppConfig {
  newPerDay: number;
  /** Remembered shared space, re-opened at boot without a prompt. */
  spaceId?: string;
  /** Sample deck already written once — never re-seed after the user deletes it. */
  seeded?: boolean;
  /** Shown as the `by` author on decks; the host gives stage apps no login. */
  displayName?: string;
}
