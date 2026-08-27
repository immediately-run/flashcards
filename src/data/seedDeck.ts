import type { Card, Deck } from '../lib/types';

// Written once, on first run, so a new user has something to study immediately.
// Ids are fixed so re-seeding (never done automatically) is idempotent.
const T0 = 1_756_000_000_000; // a fixed "created" timestamp — before any user card

export const SEED_DECK: Deck = {
  id: 'seed-world-capitals',
  name: 'World capitals',
  description: 'Fifteen countries and their capital cities. A sample deck — edit or delete it freely.',
  created: T0,
  by: 'flashcards',
};

const rows: Array<[string, string, string]> = [
  ['France', 'Paris', 'europe'],
  ['Japan', 'Tokyo', 'asia'],
  ['Canada', 'Ottawa', 'americas'],
  ['Australia', 'Canberra', 'oceania'],
  ['Brazil', 'Brasília', 'americas'],
  ['Egypt', 'Cairo', 'africa'],
  ['Turkey', 'Ankara', 'asia, europe'],
  ['Hungary', 'Budapest', 'europe'],
  ['Kenya', 'Nairobi', 'africa'],
  ['Argentina', 'Buenos Aires', 'americas'],
  ['South Korea', 'Seoul', 'asia'],
  ['Norway', 'Oslo', 'europe'],
  ['Morocco', 'Rabat', 'africa'],
  ['New Zealand', 'Wellington', 'oceania'],
  ['Vietnam', 'Hanoi', 'asia'],
];

export const SEED_CARDS: Card[] = rows.map(([country, capital, tags], i) => ({
  id: `seed-capital-${String(i + 1).padStart(2, '0')}`,
  front: `What is the capital of **${country}**?`,
  back: capital,
  tags: tags.split(',').map((t) => t.trim()),
  created: T0 + i * 1000,
}));
