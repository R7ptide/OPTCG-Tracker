import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("OPTracker.db");

const MIGRATIONS = [
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

export const initDB = () => {
  const { user_version } = db.getFirstSync("PRAGMA user_version");
  for (let i = user_version; i < MIGRATIONS.length; i++) {
    db.withTransactionSync(() => MIGRATIONS[i](db));
  }
  if (user_version < MIGRATIONS.length) {
    db.execSync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  }
};

export default db;
