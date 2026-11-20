import { initDB } from "../../database";
import db from "../../database";

describe("initDB", () => {
  it("creates the expected tables", () => {
    initDB();

    const tables = db
      .getAllSync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
      )
      .map((t) => t.name)
      .sort();

    expect(tables).toEqual([
      "cards",
      "collection",
      "deck_cards",
      "decks",
      "matches",
      "settings",
      "tournaments",
    ]);
  });

  it("adds the card detail columns", () => {
    initDB();

    const columns = db
      .getAllSync<{ name: string }>("PRAGMA table_info(cards)")
      .map((c) => c.name);

    expect(columns).toEqual(
      expect.arrayContaining([
        "pack_id",
        "effect",
        "trigger_text",
        "block_number",
      ]),
    );
  });

  it("is idempotent — safe to run multiple times", () => {
    expect(() => {
      initDB();
      initDB();
      initDB();
    }).not.toThrow();
  });
});
