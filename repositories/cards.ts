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
  "id" | "name" | "color" | "type" | "cost" | "rarity" | "image_url"
>;

export const getCardsForSet = (setId: string): MasterCardRow[] => {
  return db.getAllSync<MasterCardRow>(
    "SELECT id, name, color, type, cost, rarity, image_url FROM cards WHERE set_id = ? ORDER BY id ASC",
    [setId],
  );
};

export const getCardById = (id: string): MasterCardRow | null => {
  return db.getFirstSync<MasterCardRow>(
    "SELECT id, name, color, type, cost, rarity, image_url FROM cards WHERE id = ?",
    [id],
  );
};

export const getAllLeaders = (): MasterCardRow[] => {
  return db.getAllSync<MasterCardRow>(
    "SELECT id, name, color, type, cost, rarity, image_url FROM cards WHERE type = 'Leader' ORDER BY name ASC",
  );
};

export const searchCardsByName = (
  name: string,
  limit = 100,
): MasterCardRow[] => {
  return db.getAllSync<MasterCardRow>(
    "SELECT id, name, color, type, cost, rarity, image_url FROM cards WHERE name LIKE ? ORDER BY name ASC LIMIT ?",
    [`%${name}%`, limit],
  );
};

export const upsertCards = (cards: CardRow[]): void => {
  db.withTransactionSync(() => {
    const insertStmt = db.prepareSync(`
      INSERT OR REPLACE INTO cards
      (id, name, color, type, cost, power, attribute, rarity, image_url, set_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

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
      ]);
    }
  });
};
