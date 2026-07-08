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

type Migration = (db: SQLite.SQLiteDatabase) => void;

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
  // Next migration example (for tournament tracking):
  // (db) => {
  //   db.execSync(`
  //     CREATE TABLE tournaments (
  //       id INTEGER PRIMARY KEY AUTOINCREMENT,
  //       name TEXT NOT NULL,
  //       date TEXT NOT NULL,
  //       placement INTEGER
  //     );
  //     CREATE TABLE matches (
  //       id INTEGER PRIMARY KEY AUTOINCREMENT,
  //       tournament_id INTEGER NOT NULL,
  //       opponent_leader TEXT,
  //       result TEXT CHECK (result IN ('W','L','D')) NOT NULL,
  //       FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
  //     );
  //   `);
  // },
];

export const initDB = (): void => {
  const row = db.getFirstSync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;
  for (let i = version; i < MIGRATIONS.length; i++) {
    db.withTransactionSync(() => MIGRATIONS[i](db));
  }
  if (version < MIGRATIONS.length) {
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  }
};

export default db;
