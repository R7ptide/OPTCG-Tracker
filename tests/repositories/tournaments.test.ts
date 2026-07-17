import { initDB } from "../../database";
import db from "../../database";
import {
  createTournament,
  getTournamentById,
  getTournaments,
  updateTournamentPlacement,
  addMatch,
  getMatchesForTournament,
  updateMatch,
  deleteMatch,
} from "../../repositories/tournaments";

beforeAll(() => {
  initDB();
});

beforeEach(() => {
  db.execSync("DELETE FROM matches; DELETE FROM tournaments;");
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

  it("orders tournaments newest first", () => {
    const first = createTournament({ title: "Older" });
    const second = createTournament({ title: "Newer" });

    const ids = getTournaments().map((t) => t.id);
    expect(ids.indexOf(second)).toBeLessThan(ids.indexOf(first));
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
