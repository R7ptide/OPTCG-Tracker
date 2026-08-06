import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("OPTracker.db");

export type CardRow = {
  id: string;
  name: string | null;
  color: string | null;
  type: string | null;
  cost: number | null;
  power: number | null;
  attribute: string | null;
  rarity: string | null;
  image_url: string | null;
  set_id: string | null;
};

export type CollectionRow = {
  card_id: string;
  quantity: number;
  is_staple: number;
};

export type TournamentRow = {
  id: number;
  title: string;
  format: string;
  leader_id: string | null;
  placement: number | null;
  event_date: string;
  created_at: string;
};

export type MatchResult = "W" | "L" | "BYE";

export type MatchRow = {
  id: number;
  tournament_id: number;
  opponent_leader_id: string | null;
  result: MatchResult;
  dice_roll: number | null;
  went_first: number | null;
  comment: string | null;
  created_at: string;
};

type Migration = (db: SQLite.SQLiteDatabase) => void;

const hasColumn = (
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
): boolean => {
  const columns = db.getAllSync<{ name: string }>(
    `PRAGMA table_info(${table})`,
  );
  return columns.some((c) => c.name === column);
};

const MIGRATIONS: Migration[] = [
  (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS cards (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT,
        color TEXT,
        type TEXT,
        cost INTEGER,
        power INTEGER,
        attribute TEXT,
        rarity TEXT,
        image_url TEXT,
        set_id TEXT
      );

      CREATE TABLE IF NOT EXISTS collection (
        card_id TEXT PRIMARY KEY NOT NULL,
        quantity INTEGER DEFAULT 1,
        is_staple BOOLEAN DEFAULT 0,
        FOREIGN KEY (card_id) REFERENCES cards (id)
      );
    `);
  },
  (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `);
  },
  (db) => {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS tournaments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        leader_id TEXT,
        placement INTEGER,
        event_date TEXT NOT NULL DEFAULT CURRENT_DATE,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_id INTEGER NOT NULL,
        opponent_leader_id TEXT,
        result TEXT CHECK (result IN ('W','L','BYE')) NOT NULL,
        went_first BOOLEAN,
        comment TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
      );
    `);
  },
  (db) => {
    if (!hasColumn(db, "tournaments", "format")) {
      db.execSync(
        `ALTER TABLE tournaments ADD COLUMN format TEXT NOT NULL DEFAULT 'Legacy';`,
      );
    }

    if (!hasColumn(db, "matches", "dice_roll")) {
      db.execSync(`ALTER TABLE matches ADD COLUMN dice_roll INTEGER;`);
    }
  },
  (db) => {
    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_cards_set_id ON cards (set_id);
      CREATE INDEX IF NOT EXISTS idx_matches_tournament_id ON matches (tournament_id);
    `);
  },
];

export const initDB = (): void => {
  db.execSync("PRAGMA foreign_keys = ON;");

  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;

  console.log(`[Database] Current PRAGMA user_version: ${version}`);

  for (let i = version; i < MIGRATIONS.length; i++) {
    console.log(`[Database] Applying migration ${i}...`);
    db.withTransactionSync(() => MIGRATIONS[i](db));
  }

  if (version < MIGRATIONS.length) {
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length}`);
    console.log(
      `[Database] Updated PRAGMA user_version to: ${MIGRATIONS.length}`,
    );
  }
};

export default db;
