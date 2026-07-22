import { initDB } from "../../database";
import db from "../../database";

beforeAll(() => {
  initDB();
});

beforeEach(() => {
  db.execSync("DELETE FROM matches; DELETE FROM tournaments;");
});

describe("tournaments / matches schema", () => {
  it("cascades match deletion when a tournament is deleted", () => {
    const { lastInsertRowId: tournamentId } = db.runSync(
      "INSERT INTO tournaments (title) VALUES (?)",
      ["Regional Qualifier"],
    );
    db.runSync(
      "INSERT INTO matches (tournament_id, result) VALUES (?, 'W')",
      [tournamentId],
    );
    db.runSync(
      "INSERT INTO matches (tournament_id, result) VALUES (?, 'L')",
      [tournamentId],
    );

    db.runSync("DELETE FROM tournaments WHERE id = ?", [tournamentId]);

    const remaining = db.getAllSync("SELECT * FROM matches");
    expect(remaining).toHaveLength(0);
  });

  it("rejects a match result outside W/L/BYE", () => {
    const { lastInsertRowId: tournamentId } = db.runSync(
      "INSERT INTO tournaments (title) VALUES (?)",
      ["Local Store Event"],
    );

    expect(() =>
      db.runSync(
        "INSERT INTO matches (tournament_id, result) VALUES (?, 'D')",
        [tournamentId],
      ),
    ).toThrow();
  });

  it("allows a BYE match with no opponent leader", () => {
    const { lastInsertRowId: tournamentId } = db.runSync(
      "INSERT INTO tournaments (title) VALUES (?)",
      ["Odd Player Count Cup"],
    );

    expect(() =>
      db.runSync(
        "INSERT INTO matches (tournament_id, result, opponent_leader_id) VALUES (?, 'BYE', NULL)",
        [tournamentId],
      ),
    ).not.toThrow();
  });
});
