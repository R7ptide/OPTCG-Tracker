# Plan: Card modal with scrollable details

Status: planning only, nothing implemented yet.

## Goal

Make `components/CardModal.tsx` scrollable. Keep the large card image and the
+1 / -1 quantity controls at the top. Below them add:

1. An opaque stats block: type, name, attribute, cost/life, traits, power,
   color, counter, block, set.
2. The card's effect text (and trigger, when it has one).
3. A reserved space for the price, to be filled in later.

## What the data allows

- **Effect, trigger and block number** are not in `cards_by_id.json`, which is
  what the app syncs today. They are in the per-pack files,
  `english/data/<pack_id>.json` (fields `effect`, `trigger`, `block_number`).
  The home server mirrors this path. Each card in `cards_by_id.json` already
  carries its `pack_id`.
- `_p1` alt arts appear in the pack files. `_m1` entries do not, because they
  are added by hand in `constants/manualCards.ts`.
- **Life** has no field of its own. For Leaders it is stored in `cost`
  (OP01-001 Zoro has `cost: 5`), so the modal labels it "Life" when
  `type === "Leader"`.
- **Power** and **counter** are already in the `cards` table, but
  `MasterCardRow` and `CollectionCard` don't expose power (and the modal
  doesn't show counter).
- **Set name** is in `packs.json` (e.g. "STARTER DECK -Straw Hat Crew- [ST-01]").
  Today the app only derives `set_id` from the card id.

## Decisions made

- `block_number` is display-only for now. It may be used later for filtering
  and rotation legality, so it is stored as an `INTEGER` column.
- Manual entries (`_m1`) keep precedence over pack-file data for their fields.
- If one pack file fails to download, skip that pack and retry on the next
  sync. Keep any text already stored for it. Do not abort the whole sync.
- After the migration, clear the stored cards commit so existing users
  re-sync on next launch.
- A card with no effect text hides the effect section (many cards have none).
- Search and filters stay exactly as they are. Effect text is not searched.
- Stats block shows counter and block. Keywords are not shown.
- Set row shows the set code only (e.g. "OP01"), so no `packs` table is needed.
- Effect text is plain text for now. Highlighting inline tags comes later.
- Price is a placeholder only. No `card_prices` table in this migration.

## Work items

### 1. DB migration (`database.ts`)

Add a new entry to `MIGRATIONS`, using the `hasColumn` pattern:

- `pack_id TEXT`
- `effect TEXT`
- `trigger_text TEXT` (`trigger` clashes with the SQL keyword)
- `block_number INTEGER`
- Clear the stored cards commit setting so the next launch re-syncs.
- No `packs` table: the set row uses the code derived from the card id.
- Prices, later (not in this migration): a separate `card_prices` table
  (`card_id`, `price`, `currency`, `updated_at`), not columns on `cards`.
  Prices change often and come from a different source than card data.

### 2. Sync (`utils/cardSync.ts`, `hooks/useSync.ts`, `constants/server.ts`)

Loop per distinct `pack_id`, not per card (about 40 to 50 requests, not about
5,000):

1. Fetch `cards_by_id.json` as today.
2. Collect the distinct `pack_id` values.
3. Fetch `english/data/<pack_id>.json` once per pack, in parallel with a small
   concurrency limit. Build a map of `id -> { effect, trigger, block_number }`.
4. In `toCardRows`, join the map onto each card by id, then upsert as before.

Details:

- Add `serverUrls.data(packId)` (and a GitHub equivalent for the fallback path).
- A failed pack leaves its cards' text unchanged and is retried next sync.
  Upsert must not overwrite existing `effect` / `trigger_text` / `block_number`
  with null when a pack failed.
- Extend `PunkRecordCard` with `effect`, `trigger` and `block_number`. Fill
  them in by hand for each `_m1` entry in `MANUAL_CARDS`. Manual values win.
- Safety net: if an `_m1` entry is missing text, fall back to the base card's
  text (`ST17-004_m1` uses `ST17-004`).

### 3. Repository and types

- `repositories/cards.ts`: add `power`, `counter` (already selected),
  `effect`, `trigger_text`, `block_number`, `pack_id` to `MASTER_CARD_COLUMNS`
  and `MasterCardRow`.
- `utils/collectionCards.ts` and `CollectionCard` (in `CardModal.tsx`): add
  the same fields to `buildCollectionCards`.
- `searchCardsByName` and `filterCollectionCards` are not changed.
- Backups only store collection quantities, so they are not affected.

### 4. UI (`components/CardModal.tsx`)

- Wrap the content in a `ScrollView`. Image and +/- controls stay at the top.
- Opaque, surface-colored stats card: Type, Name, Attribute, Cost or Life,
  Traits, Power, Color, Counter, Block, Set.
- Effect section, with a trigger line when present. Hidden when there is no
  effect text.
- Reserved price section showing a placeholder such as "Price coming soon".
- The overlay currently centers its content, so switch to top-aligned
  scrolling. The tap-outside-to-close layer must keep working with the scroll
  view.
- Hide stat rows with no value (some Leaders and Events have no power, cost or
  counter).
- Keep `readOnly` behaviour. Stats show in read-only mode too.

### 5. Tests

- `tests/utils/cardSync.test.ts`: effect/trigger/block merge, manual
  precedence, `_m1` base-card fallback, failed pack keeps old text.
- `tests/database/initDB.test.ts`: new migration, commit cleared.
- `tests/repositories/cards.test.ts`: new columns.

## Suggested order

1. Migration and sync
2. Repository and types
3. Modal UI
4. Tests

## Still open

Nothing. Ready to implement.

## Later

- Highlight inline tags like `[On Play]` and `[DON!! x1]` in effect text.
- Real prices with a `card_prices` table.
- Use `block_number` for filtering and rotation legality.
