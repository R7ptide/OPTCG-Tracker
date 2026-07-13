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
      "matches",
      "settings",
      "tournaments",
    ]);
  });

  it("is idempotent — safe to run multiple times", () => {
    expect(() => {
      initDB();
      initDB();
      initDB();
    }).not.toThrow();
  });
});
