import { initDB } from "../../database";
import db from "../../database";

describe("initDB", () => {
  it("creates the expected tables", () => {
    initDB();

    const tables = db
      .getAllSync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table'",
      )
      .map((t) => t.name)
      .sort();

    expect(tables).toEqual(["cards", "collection", "settings"]);
  });

  it("is idempotent — safe to run multiple times", () => {
    expect(() => {
      initDB();
      initDB();
      initDB();
    }).not.toThrow();
  });
});
