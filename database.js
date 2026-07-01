import * as SQLite from "expo-sqlite";

// Open or create the local database file on the phone
const db = SQLite.openDatabaseSync("OPTracker.db");

export const initDB = () => {
  // TEMPORARY: Drop the old tables to force the new schema to apply
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
};

export default db;
