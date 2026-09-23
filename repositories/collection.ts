import db, { type CollectionRow } from "../database";

export type CollectionStats = { unique: number; total: number };

export const getCollectionStats = (): CollectionStats => {
  const uniqueRow = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM collection",
  );
  const totalRow = db.getFirstSync<{ sum: number | null }>(
    "SELECT SUM(quantity) as sum FROM collection",
  );
  return {
    unique: uniqueRow?.count ?? 0,
    total: totalRow?.sum ?? 0,
  };
};

export const getSetOwnedCount = (setId: string): number => {
  const row = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(col.card_id) as count
    FROM collection col
    INNER JOIN cards c ON col.card_id = c.id
    WHERE c.set_id = ? AND col.quantity > 0`,
    [setId],
  );
  return row?.count ?? 0;
};

export type SetCompletionRow = { set_id: string; total: number; owned: number };

// Single grouped query for every set's completion stats, instead of one
// getCardCountForSet + getSetOwnedCount pair per set (used by the
// collection menu, which otherwise fires 2 unindexed-ish queries per set).
export const getSetCompletionStats = (): Record<
  string,
  { total: number; owned: number }
> => {
  const rows = db.getAllSync<SetCompletionRow>(`
    SELECT
      c.set_id AS set_id,
      COUNT(*) AS total,
      COUNT(CASE WHEN col.quantity > 0 THEN 1 END) AS owned
    FROM cards c
    LEFT JOIN collection col ON col.card_id = c.id
    GROUP BY c.set_id
  `);
  const stats: Record<string, { total: number; owned: number }> = {};
  for (const row of rows) {
    stats[row.set_id] = { total: row.total, owned: row.owned };
  }
  return stats;
};

export type SetPlaysetCompletionRow = {
  set_id: string;
  total_bases: number;
  complete_bases: number;
};

// Player-mode completion: groups art variants of the same card (ids sharing
// a "-###" prefix before "_") into one base card, sums owned quantity across
// variants, and counts a base card "complete" once it hits a full playset
// (1 copy for Leaders, 4 for everything else) regardless of which variant(s)
// make up that count.
export const getSetPlaysetCompletionStats = (): Record<
  string,
  { totalBases: number; completeBases: number }
> => {
  const rows = db.getAllSync<SetPlaysetCompletionRow>(`
    WITH base_groups AS (
      SELECT
        c.set_id AS set_id,
        CASE
          WHEN instr(c.id, '_') > 0 THEN substr(c.id, 1, instr(c.id, '_') - 1)
          ELSE c.id
        END AS base_id,
        MAX(c.type) AS type,
        SUM(COALESCE(col.quantity, 0)) AS owned_qty
      FROM cards c
      LEFT JOIN collection col ON col.card_id = c.id
      GROUP BY c.set_id, base_id
    )
    SELECT
      set_id,
      COUNT(*) AS total_bases,
      COUNT(CASE
        WHEN owned_qty >= (CASE WHEN type = 'Leader' THEN 1 ELSE 4 END) THEN 1
      END) AS complete_bases
    FROM base_groups
    GROUP BY set_id
  `);
  const stats: Record<string, { totalBases: number; completeBases: number }> =
    {};
  for (const row of rows) {
    stats[row.set_id] = {
      totalBases: row.total_bases,
      completeBases: row.complete_bases,
    };
  }
  return stats;
};

export type OwnedRow = { card_id: string; quantity: number };

export const getOwnedForSet = (setId: string): OwnedRow[] => {
  return db.getAllSync<OwnedRow>(
    "SELECT card_id, quantity FROM collection WHERE card_id LIKE ?",
    [`${setId}-%`],
  );
};

export const getQuantity = (cardId: string): number => {
  const row = db.getFirstSync<{ quantity: number }>(
    "SELECT quantity FROM collection WHERE card_id = ?",
    [cardId],
  );
  return row?.quantity ?? 0;
};

export const incrementCard = (cardId: string): void => {
  const existing = db.getFirstSync<{ quantity: number }>(
    "SELECT quantity FROM collection WHERE card_id = ?",
    [cardId],
  );
  if (existing) {
    db.runSync(
      "UPDATE collection SET quantity = quantity + 1 WHERE card_id = ?",
      [cardId],
    );
  } else {
    db.runSync("INSERT INTO collection (card_id, quantity) VALUES (?, 1)", [
      cardId,
    ]);
  }
};

export const decrementCard = (cardId: string): void => {
  const existing = db.getFirstSync<{ quantity: number }>(
    "SELECT quantity FROM collection WHERE card_id = ?",
    [cardId],
  );
  if (!existing) return;

  if (existing.quantity > 1) {
    db.runSync(
      "UPDATE collection SET quantity = quantity - 1 WHERE card_id = ?",
      [cardId],
    );
  } else {
    db.runSync("DELETE FROM collection WHERE card_id = ?", [cardId]);
  }
};

export const getAllCollectionRows = (): CollectionRow[] => {
  return db.getAllSync<CollectionRow>("SELECT * FROM collection");
};

// Scoped lookup for when only a handful of card IDs are needed (e.g. search
// results) instead of loading the entire collection table.
export const getCollectionRowsForCards = (
  cardIds: string[],
): CollectionRow[] => {
  if (cardIds.length === 0) return [];
  const placeholders = cardIds.map(() => "?").join(", ");
  return db.getAllSync<CollectionRow>(
    `SELECT * FROM collection WHERE card_id IN (${placeholders})`,
    cardIds,
  );
};

export const wipeCollection = (): void => {
  db.runSync("DELETE FROM collection");
};

export type BackupRow = { card_id: string; quantity: number };

export const restoreCollection = (rows: BackupRow[]): void => {
  db.withTransactionSync(() => {
    db.runSync("DELETE FROM collection");
    const insertStmt = db.prepareSync(
      "INSERT INTO collection (card_id, quantity) VALUES (?, ?)",
    );
    try {
      rows.forEach((item) => {
        if (item.card_id && item.quantity) {
          insertStmt.executeSync([item.card_id, item.quantity]);
        }
      });
    } finally {
      insertStmt.finalizeSync();
    }
  });
};
