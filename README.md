# Flashcards

Spaced-repetition flashcards for [immediately.run](https://immediately.run). A deck is a
folder of cards; keep decks to yourself or publish them into a shared space so a whole
class can study — and co-edit — the same cards. Review progress is always private to you.

**Try it:** <https://immediately.run/present/github/immediately-run/flashcards/main/files/src/App.tsx>

## What it does

- **Study** with SM-2 scheduling: grade each card *again / hard / good / easy*
  (keys `1`–`4`, `space` to flip and to answer *good*). Due cards come first, then new
  cards up to your daily limit (default 20, editable on the home screen). Forgotten
  cards come back a few cards later in the same session. A summary closes the session.
- **Decks** show total / due today / learned / new, a card list with inline add, edit and
  delete, **import** from pasted text (one card per line, `front<TAB>back<TAB>tags` or
  `front; back; tags`) and **export** to the same format.
- Card text renders `**bold**`, `*emphasis*` and line breaks through a tiny parser that
  emits React elements — user text never reaches `innerHTML`.
- **Sharing:** *Publish to a space* copies a private deck into a shared space (the host
  asks you to pick or create one). *Open shared decks* mounts a space and lists its decks;
  the space is remembered and re-opened silently next time. While a shared deck is open
  its cards folder is polled every 3 s so classmates' edits appear.
- A 15-card sample deck (world capitals) is written on first run. Delete it if you like —
  it is never re-seeded.

## How data is stored

Everything is files on the immediately.run filesystem; one record per file so several
people can write concurrently without clobbering each other.

```
<store>/decks/<deckId>/deck.json            { id, name, description, created, by }
<store>/decks/<deckId>/cards/<cardId>.json  { id, front, back, tags, created }
<private>/progress/<deckId>/<cardId>.json   { ease, interval, due, reps, lapses, firstSeen }
<private>/config.json                       { newPerDay, spaceId?, seeded }
```

`<store>` is either your **private** per-user, per-app folder (the settings mount) or a
**shared space** you granted the app. `<private>` is always the private folder: studying
a shared deck writes SM-2 state under your own `progress/<deckId>/`, keyed by the deck id,
never into the space. Publishing keeps the deck id, so progress you built on the private
copy carries over to the shared one.

## Multi-user notes

- The app cannot invite people. Share the space itself from the platform's Spaces UI;
  members then use *Open shared decks* and pick it.
- Read-only members can study and export but see no add/edit/delete/publish controls
  (the host would reject the writes with `EROFS`).
- Shared spaces emit no remote change events, so the app polls the open deck's `cards/`
  directory and the space's `decks/` directory every 3 s. Deck edits by others may take
  that long to show; card counts on the home tiles refresh when the deck list changes.
- Two people editing the *same card* within a few seconds is last-write-wins for that one
  file. Adding cards never conflicts.

## Local development

```bash
npm install
npm run dev      # vite; `fs` is bridged to ./devfs-playground/ (git-ignored)
npm run build    # tsc + vite build
npm run lint
```

Under `vite dev` there is no host: the private store is `devfs-playground/settings/data`
and every "space" resolves to `devfs-playground/shared`, so the sharing flows run without
prompts. To exercise the real consent prompts, mounts and read-only grants, run the
working tree inside the host instead:

```bash
npx @immediately-run/cli dev . --origin https://local.immediately.run
```

## Layout

- `src/App.tsx` — entry (the host renders its default export); view routing.
- `src/components/` — one component per file (home, deck, study, flip card, forms).
- `src/hooks/` — boot/config/shared-space state, deck/card listing, progress.
- `src/lib/` — `store.ts` (immediately.run persistence), `sm2.ts`, `session.ts`,
  `deckStore.ts`, `progressStore.ts`, `markup.ts`, `importExport.ts`.
- `src/data/seedDeck.ts` — the sample deck.

MIT — see `LICENSE`.
