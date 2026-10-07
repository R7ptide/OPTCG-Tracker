import db, { initDB } from "../../database";
import { upsertCards } from "../../repositories/cards";
import { incrementCard, getAllCollectionRows } from "../../repositories/collection";
import { createDeck, getDecks, getDeckCards, setDeckCardQuantity } from "../../repositories/decks";
import { createTournament, addMatch, getTournaments, getMatchesForTournament } from "../../repositories/tournaments";
import {
  buildBackupPayload,
  restoreBackupPayload,
  isLegacyCollectionBackup,
  isBackupPayload,
  BACKUP_VERSION,
} from "../../repositories/backup";
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
  traits: null,
  counter: null,
  ...overrides,
});

beforeAll(() => {
  initDB();
});

beforeEach(() => {
  db.execSync("DELETE FROM matches; DELETE FROM tournaments; DELETE FROM collection; DELETE FROM decks; DELETE FROM cards;");
  upsertCards([makeCard({ id: "OP01-001", set_id: "OP01" })]);
});

describe("buildBackupPayload / restoreBackupPayload", () => {
  it("bundles collection, tournaments, and matches together", () => {
    incrementCard("OP01-001");
    const tournamentId = createTournament({ title: "Cup A", format: "Legacy" });
    addMatch({ tournamentId, result: "W" });

    const payload = buildBackupPayload();

    expect(payload.version).toBe(BACKUP_VERSION);
    expect(payload.collection).toHaveLength(1);
    expect(payload.tournaments).toHaveLength(1);
    expect(payload.matches).toHaveLength(1);
  });

  it("round-trips a full backup, replacing existing data", () => {
    incrementCard("OP01-001");
    const tournamentId = createTournament({ title: "Cup B", format: "Legacy" });
    addMatch({ tournamentId, result: "L" });
    const payload = buildBackupPayload();

    db.execSync("DELETE FROM matches; DELETE FROM tournaments; DELETE FROM collection;");
    expect(getAllCollectionRows()).toHaveLength(0);
    expect(getTournaments()).toHaveLength(0);

    restoreBackupPayload(payload);

    expect(getAllCollectionRows()).toHaveLength(1);
    expect(getTournaments()).toHaveLength(1);
    expect(getMatchesForTournament(tournamentId)).toHaveLength(1);
  });
});

describe("deck backup", () => {
  it("round-trips decks and their cards", () => {
    const deckId = createDeck({ name: "Red Aggro", leaderId: "OP01-001" });
    setDeckCardQuantity(deckId, "OP01-001", 3);
    const payload = buildBackupPayload();

    db.execSync("DELETE FROM decks;");
    expect(getDecks()).toHaveLength(0);

    restoreBackupPayload(payload);

    const decks = getDecks();
    expect(decks).toHaveLength(1);
    expect(decks[0].name).toBe("Red Aggro");
    expect(getDeckCards(deckId).map((c) => c.quantity)).toEqual([3]);
  });

  it("leaves existing decks alone when restoring a pre-v3 backup", () => {
    createDeck({ name: "Keep Me" });
    restoreBackupPayload({
      version: 2,
      exportedAt: "",
      collection: [],
      tournaments: [],
      matches: [],
    });
    expect(getDecks()).toHaveLength(1);
  });
});

describe("isLegacyCollectionBackup / isBackupPayload", () => {
  it("identifies a bare array as a legacy collection-only backup", () => {
    expect(isLegacyCollectionBackup([{ card_id: "OP01-001", quantity: 1 }])).toBe(true);
    expect(isBackupPayload([{ card_id: "OP01-001", quantity: 1 }])).toBe(false);
  });

  it("identifies a versioned payload", () => {
    const payload = buildBackupPayload();
    expect(isBackupPayload(payload)).toBe(true);
    expect(isLegacyCollectionBackup(payload)).toBe(false);
  });
});
