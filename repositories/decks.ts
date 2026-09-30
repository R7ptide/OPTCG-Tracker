import db, { type DeckCardRow, type DeckRow } from "../database";
import { type MasterCardRow } from "./cards";

export type NewDeck = {
  name: string;
  leaderId?: string | null;
};

export const createDeck = (input: NewDeck): number => {
  const result = db.runSync(
    "INSERT INTO decks (name, leader_id) VALUES (?, ?)",
    [input.name, input.leaderId ?? null],
  );
  return result.lastInsertRowId;
};

export const getDeckById = (id: number): DeckRow | null => {
  return db.getFirstSync<DeckRow>("SELECT * FROM decks WHERE id = ?", [id]);
};

export type DeckWithSummary = DeckRow & {
  leaderName: string | null;
  leaderImageUrl: string | null;
  cardCount: number;
};

export const getDecks = (): DeckWithSummary[] => {
  return db.getAllSync<DeckWithSummary>(`
    SELECT
      d.*,
      c.name AS leaderName,
      c.image_url AS leaderImageUrl,
      COALESCE((SELECT SUM(dc.quantity) FROM deck_cards dc WHERE dc.deck_id = d.id), 0) AS cardCount
    FROM decks d
    LEFT JOIN cards c ON c.id = d.leader_id
    ORDER BY d.updated_at DESC, d.id DESC
  `);
};

export const getDeckSummaryById = (id: number): DeckWithSummary | null => {
  return db.getFirstSync<DeckWithSummary>(
    `
    SELECT
      d.*,
      c.name AS leaderName,
      c.image_url AS leaderImageUrl,
      COALESCE((SELECT SUM(dc.quantity) FROM deck_cards dc WHERE dc.deck_id = d.id), 0) AS cardCount
    FROM decks d
    LEFT JOIN cards c ON c.id = d.leader_id
    WHERE d.id = ?
  `,
    [id],
  );
};

export type DeckCardWithInfo = DeckCardRow & MasterCardRow;

export const getDeckCards = (deckId: number): DeckCardWithInfo[] => {
  return db.getAllSync<DeckCardWithInfo>(
    `
    SELECT dc.deck_id, dc.card_id, dc.quantity,
      c.id, c.name, c.color, c.type, c.cost, c.rarity, c.image_url, c.attribute, c.traits
    FROM deck_cards dc
    JOIN cards c ON c.id = dc.card_id
    WHERE dc.deck_id = ?
    ORDER BY c.cost ASC, c.name ASC
  `,
    [deckId],
  );
};

export type DeckMetaUpdate = {
  name: string;
  leaderId?: string | null;
};

export const updateDeckMeta = (id: number, input: DeckMetaUpdate): void => {
  db.runSync(
    "UPDATE decks SET name = ?, leader_id = ?, updated_at = datetime('now') WHERE id = ?",
    [input.name, input.leaderId ?? null, id],
  );
};

export const setDeckCardQuantity = (
  deckId: number,
  cardId: string,
  quantity: number,
): void => {
  db.withTransactionSync(() => {
    if (quantity <= 0) {
      db.runSync("DELETE FROM deck_cards WHERE deck_id = ? AND card_id = ?", [
        deckId,
        cardId,
      ]);
    } else {
      db.runSync(
        `INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (?, ?, ?)
         ON CONFLICT (deck_id, card_id) DO UPDATE SET quantity = excluded.quantity`,
        [deckId, cardId, quantity],
      );
    }
    db.runSync("UPDATE decks SET updated_at = datetime('now') WHERE id = ?", [
      deckId,
    ]);
  });
};

export const deleteDeck = (id: number): void => {
  db.runSync("DELETE FROM decks WHERE id = ?", [id]);
};
