import { initDB } from "../../database";
import db from "../../database";
import {
  createTournament,
  getTournamentById,
  getTournaments,
  searchTournaments,
  updateTournamentPlacement,
  updateTournament,
  deleteTournament,
  addMatch,
  getMatchesForTournament,
  updateMatch,
  deleteMatch,
} from "../../repositories/tournaments";
import { upsertCards } from "../../repositories/cards";
import type { CardRow } from "../../database";

const makeCard = (overrides: Partial<CardRow> & { id: string }): CardRow => ({
  name: null,
  color: null,
  type: null,
  cost: null,
  power: null,
  attribute: null,
  rarity: null,
  image_url: null,
  set_id: null,
  ...overrides,
});

beforeAll(() => {
  initDB();
});

beforeEach(() => {
  db.execSync("DELETE FROM matches; DELETE FROM tournaments; DELETE FROM cards;");
});

describe("createTournament / getTournamentById", () => {
  it("creates a tournament with defaults for optional fields", () => {
    const id = createTournament({ title: "Local Store Event" });
    const tournament = getTournamentById(id);

    expect(tournament).toMatchObject({
      id,
      title: "Local Store Event",
      description: null,
      leader_id: null,
      placement: null,
    });
  });

  it("stores optional fields when provided", () => {
    const id = createTournament({
      title: "Regional Qualifier",
      description: "Swiss rounds, top 8 cut",
      leaderId: "OP01-001",
      placement: 2,
    });

    expect(getTournamentById(id)).toMatchObject({
      title: "Regional Qualifier",
      description: "Swiss rounds, top 8 cut",
      leader_id: "OP01-001",
      placement: 2,
    });
  });

  it("returns null for a missing tournament", () => {
    expect(getTournamentById(9999)).toBeNull();
  });

  it("defaults event_date to today when not provided", () => {
    const id = createTournament({ title: "No Date Given" });
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    expect(getTournamentById(id)).toMatchObject({ event_date: today });
  });

  it("stores an explicit event_date for backfilled entries", () => {
    const id = createTournament({
      title: "Forgot to Log This One",
      eventDate: "2024-03-01",
    });
    expect(getTournamentById(id)).toMatchObject({ event_date: "2024-03-01" });
  });
});

describe("updateTournamentPlacement", () => {
  it("sets the placement on an existing tournament", () => {
    const id = createTournament({ title: "Cup G" });
    updateTournamentPlacement(id, 1);
    expect(getTournamentById(id)).toMatchObject({ placement: 1 });
  });

  it("overwrites a previously set placement", () => {
    const id = createTournament({ title: "Cup H", placement: 4 });
    updateTournamentPlacement(id, 11);
    expect(getTournamentById(id)).toMatchObject({ placement: 11 });
  });

  it("clears the placement when set to null", () => {
    const id = createTournament({ title: "Cup I", placement: 2 });
    updateTournamentPlacement(id, null);
    expect(getTournamentById(id)).toMatchObject({ placement: null });
  });
});

describe("updateTournament", () => {
  it("overwrites all editable fields", () => {
    const id = createTournament({
      title: "Original Title",
      description: "Original description",
      leaderId: "OP01-001",
      placement: 3,
      eventDate: "2024-01-01",
    });

    updateTournament(id, {
      title: "Corrected Title",
      description: "Corrected description",
      leaderId: "OP02-001",
      placement: 1,
      eventDate: "2024-02-15",
    });

    expect(getTournamentById(id)).toMatchObject({
      title: "Corrected Title",
      description: "Corrected description",
      leader_id: "OP02-001",
      placement: 1,
      event_date: "2024-02-15",
    });
  });

  it("clears optional fields when set to null", () => {
    const id = createTournament({
      title: "Cup M",
      description: "Has a description",
      leaderId: "OP01-001",
      placement: 2,
    });

    updateTournament(id, {
      title: "Cup M",
      description: null,
      leaderId: null,
      placement: null,
      eventDate: "2024-03-01",
    });

    expect(getTournamentById(id)).toMatchObject({
      description: null,
      leader_id: null,
      placement: null,
    });
  });
});

describe("deleteTournament", () => {
  it("removes the tournament and cascades to its matches", () => {
    const id = createTournament({ title: "Cup N" });
    addMatch({ tournamentId: id, result: "W" });
    addMatch({ tournamentId: id, result: "L" });

    deleteTournament(id);

    expect(getTournamentById(id)).toBeNull();
    expect(getMatchesForTournament(id)).toHaveLength(0);
  });

  it("leaves other tournaments untouched", () => {
    const keep = createTournament({ title: "Keep Me" });
    const remove = createTournament({ title: "Remove Me" });

    deleteTournament(remove);

    expect(getTournamentById(keep)).not.toBeNull();
    expect(getTournamentById(remove)).toBeNull();
  });
});

describe("getTournaments", () => {
  it("counts a BYE as a win in the record, while tracking it separately too", () => {
    const id = createTournament({ title: "Cup A" });
    addMatch({ tournamentId: id, result: "W" });
    addMatch({ tournamentId: id, result: "W" });
    addMatch({ tournamentId: id, result: "L" });
    addMatch({ tournamentId: id, result: "BYE" });

    const [tournament] = getTournaments();
    expect(tournament).toMatchObject({
      id,
      wins: 3,
      losses: 1,
      byes: 1,
      totalMatches: 4,
    });
  });

  it("returns a zeroed record for a tournament with no matches yet", () => {
    createTournament({ title: "Fresh Cup" });

    const [tournament] = getTournaments();
    expect(tournament).toMatchObject({
      wins: 0,
      losses: 0,
      byes: 0,
      totalMatches: 0,
    });
  });

  it("orders tournaments newest first when logged in order", () => {
    const first = createTournament({ title: "Older" });
    const second = createTournament({ title: "Newer" });

    const ids = getTournaments().map((t) => t.id);
    expect(ids.indexOf(second)).toBeLessThan(ids.indexOf(first));
  });

  it("orders by event_date rather than logging order, for backfilled entries", () => {
    const loggedFirstButEarlier = createTournament({
      title: "Backfilled",
      eventDate: "2024-01-01",
    });
    const loggedSecondButRecent = createTournament({
      title: "Actually Recent",
      eventDate: "2025-06-15",
    });

    const ids = getTournaments().map((t) => t.id);
    expect(ids.indexOf(loggedSecondButRecent)).toBeLessThan(
      ids.indexOf(loggedFirstButEarlier),
    );
  });
});

describe("addMatch / getMatchesForTournament", () => {
  it("stores match details and coerces went_first to 0/1", () => {
    const id = createTournament({ title: "Cup B" });
    addMatch({
      tournamentId: id,
      opponentLeaderId: "OP02-001",
      result: "W",
      wentFirst: true,
      comment: "Their leader whiffed the double attack",
    });
    addMatch({
      tournamentId: id,
      opponentLeaderId: "OP03-001",
      result: "L",
      wentFirst: false,
    });

    const matches = getMatchesForTournament(id);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({
      opponent_leader_id: "OP02-001",
      result: "W",
      went_first: 1,
      comment: "Their leader whiffed the double attack",
    });
    expect(matches[1]).toMatchObject({
      opponent_leader_id: "OP03-001",
      result: "L",
      went_first: 0,
    });
  });

  it("allows a BYE match with no opponent or went_first", () => {
    const id = createTournament({ title: "Cup C" });
    addMatch({ tournamentId: id, result: "BYE" });

    const [match] = getMatchesForTournament(id);
    expect(match).toMatchObject({
      opponent_leader_id: null,
      result: "BYE",
      went_first: null,
    });
  });

  it("returns matches in creation order", () => {
    const id = createTournament({ title: "Cup D" });
    const first = addMatch({ tournamentId: id, result: "W" });
    const second = addMatch({ tournamentId: id, result: "L" });

    const matches = getMatchesForTournament(id);
    expect(matches.map((m) => m.id)).toEqual([first, second]);
  });

  it("scopes matches to their own tournament", () => {
    const idA = createTournament({ title: "Cup E" });
    const idB = createTournament({ title: "Cup F" });
    addMatch({ tournamentId: idA, result: "W" });
    addMatch({ tournamentId: idB, result: "L" });

    expect(getMatchesForTournament(idA)).toHaveLength(1);
    expect(getMatchesForTournament(idB)).toHaveLength(1);
  });
});

describe("updateMatch", () => {
  it("overwrites result, opponent, turn order, and comment", () => {
    const id = createTournament({ title: "Cup J" });
    const matchId = addMatch({
      tournamentId: id,
      opponentLeaderId: "OP01-001",
      result: "W",
      wentFirst: true,
      comment: "original note",
    });

    updateMatch(matchId, {
      opponentLeaderId: "OP02-001",
      result: "L",
      wentFirst: false,
      comment: "corrected note",
    });

    const [match] = getMatchesForTournament(id);
    expect(match).toMatchObject({
      opponent_leader_id: "OP02-001",
      result: "L",
      went_first: 0,
      comment: "corrected note",
    });
  });

  it("can convert a match to a BYE, clearing opponent and turn order", () => {
    const id = createTournament({ title: "Cup K" });
    const matchId = addMatch({
      tournamentId: id,
      opponentLeaderId: "OP01-001",
      result: "W",
      wentFirst: true,
    });

    updateMatch(matchId, { result: "BYE" });

    const [match] = getMatchesForTournament(id);
    expect(match).toMatchObject({
      opponent_leader_id: null,
      result: "BYE",
      went_first: null,
    });
  });
});

describe("deleteMatch", () => {
  it("removes only the targeted match", () => {
    const id = createTournament({ title: "Cup L" });
    const keep = addMatch({ tournamentId: id, result: "W" });
    const remove = addMatch({ tournamentId: id, result: "L" });

    deleteMatch(remove);

    const matches = getMatchesForTournament(id);
    expect(matches.map((m) => m.id)).toEqual([keep]);
  });
});

describe("searchTournaments", () => {
  beforeEach(() => {
    upsertCards([
      makeCard({ id: "OP01-001", name: "Monkey D. Luffy", type: "Leader" }),
      makeCard({ id: "OP02-001", name: "Roronoa Zoro", type: "Leader" }),
    ]);
  });

  it("matches by tournament title", () => {
    const match = createTournament({ title: "Regional Qualifier" });
    createTournament({ title: "Local Store Event" });

    const results = searchTournaments("regional");
    expect(results.map((t) => t.id)).toEqual([match]);
  });

  it("matches by leader name, case-insensitively", () => {
    const match = createTournament({
      title: "Cup A",
      leaderId: "OP01-001",
    });
    createTournament({ title: "Cup B", leaderId: "OP02-001" });

    const results = searchTournaments("luffy");
    expect(results.map((t) => t.id)).toEqual([match]);
  });

  it("returns no results when nothing matches", () => {
    createTournament({ title: "Cup C", leaderId: "OP01-001" });
    expect(searchTournaments("nonexistent")).toHaveLength(0);
  });

  it("returns everything for an empty query", () => {
    const a = createTournament({ title: "Cup D" });
    const b = createTournament({ title: "Cup E" });
    expect(searchTournaments("").map((t) => t.id).sort()).toEqual(
      [a, b].sort(),
    );
  });

  it("still computes the win/loss record for matched tournaments", () => {
    const id = createTournament({ title: "Cup F", leaderId: "OP01-001" });
    addMatch({ tournamentId: id, result: "W" });
    addMatch({ tournamentId: id, result: "L" });

    const [result] = searchTournaments("luffy");
    expect(result).toMatchObject({ wins: 1, losses: 1 });
  });
});
