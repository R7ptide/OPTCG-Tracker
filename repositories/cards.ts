import db, { type CardRow } from "../database";

export const getTotalCardCount = (): number => {
  const row = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(id) as count FROM cards",
  );
  return row?.count ?? 0;
};

export const getCardCountForSet = (setId: string): number => {
  const row = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(id) as count FROM cards WHERE set_id = ?",
    [setId],
  );
  return row?.count ?? 0;
};

export type MasterCardRow = Pick<
  CardRow,
  | "id"
  | "name"
  | "color"
  | "type"
  | "cost"
  | "rarity"
  | "image_url"
  | "attribute"
  | "traits"
>;

const MASTER_CARD_COLUMNS =
  "id, name, color, type, cost, rarity, image_url, attribute, traits";

export const getCardsForSet = (setId: string): MasterCardRow[] => {
  return db.getAllSync<MasterCardRow>(
    `SELECT ${MASTER_CARD_COLUMNS} FROM cards WHERE set_id = ? ORDER BY id ASC`,
    [setId],
  );
};

export const getCardById = (id: string): MasterCardRow | null => {
  return db.getFirstSync<MasterCardRow>(
    `SELECT ${MASTER_CARD_COLUMNS} FROM cards WHERE id = ?`,
    [id],
  );
};

export const getAllLeaders = (): MasterCardRow[] => {
  return db.getAllSync<MasterCardRow>(
    `SELECT ${MASTER_CARD_COLUMNS} FROM cards WHERE type = 'Leader' ORDER BY name ASC`,
  );
};

// Matches against name, attribute (e.g. "Slash"), and traits (e.g. "Straw Hat Crew")
// so one search bar covers all three without a separate filter control.
export const searchCardsByName = (
  name: string,
  limit = 100,
): MasterCardRow[] => {
  const term = `%${name}%`;
  return db.getAllSync<MasterCardRow>(
    `SELECT ${MASTER_CARD_COLUMNS} FROM cards
     WHERE name LIKE ? OR attribute LIKE ? OR traits LIKE ?
     ORDER BY name ASC LIMIT ?`,
    [term, term, term, limit],
  );
};

export const upsertCards = (cards: CardRow[]): void => {
  db.withTransactionSync(() => {
    const insertStmt = db.prepareSync(`
      INSERT OR REPLACE INTO cards
      (id, name, color, type, cost, power, attribute, rarity, image_url, set_id, traits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      for (const card of cards) {
        insertStmt.executeSync([
          card.id,
          card.name,
          card.color,
          card.type,
          card.cost,
          card.power,
          card.attribute,
          card.rarity,
          card.image_url,
          card.set_id,
          card.traits,
        ]);
      }
    } finally {
      insertStmt.finalizeSync();
    }
  });
};
