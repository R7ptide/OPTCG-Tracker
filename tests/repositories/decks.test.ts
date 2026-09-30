import { initDB } from "../../database";
import db from "../../database";
import type { CardRow } from "../../database";
import { upsertCards } from "../../repositories/cards";
import {
  createDeck,
  deleteDeck,
  getDeckById,
  getDeckCards,
  getDeckSummaryById,
  getDecks,
  setDeckCardQuantity,
  updateDeckMeta,
} from "../../repositories/decks";

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
  db.execSync("DELETE FROM deck_cards; DELETE FROM decks; DELETE FROM cards;");
  upsertCards([
    makeCard({ id: "OP01-001", name: "Monkey D. Luffy", type: "Leader" }),
    makeCard({ id: "OP01-002", name: "Roronoa Zoro", type: "Character" }),
    makeCard({ id: "OP01-003", name: "Nami", type: "Character" }),
  ]);
});

describe("createDeck / getDeckById", () => {
  it("creates a deck with a name and leader", () => {
    const id = createDeck({ name: "Red Aggro", leaderId: "OP01-001" });
    const deck = getDeckById(id);

    expect(deck?.name).toBe("Red Aggro");
    expect(deck?.leader_id).toBe("OP01-001");
  });

  it("allows creating a deck without a leader", () => {
    const id = createDeck({ name: "Draft" });
    expect(getDeckById(id)?.leader_id).toBeNull();
  });

  it("returns null for a non-existent deck", () => {
    expect(getDeckById(999)).toBeNull();
  });
});

describe("getDecks / getDeckSummaryById", () => {
  it("joins leader info and sums card count", () => {
    const id = createDeck({ name: "Red Aggro", leaderId: "OP01-001" });
    setDeckCardQuantity(id, "OP01-002", 4);
    setDeckCardQuantity(id, "OP01-003", 2);

    const summary = getDeckSummaryById(id);
    expect(summary?.leaderName).toBe("Monkey D. Luffy");
    expect(summary?.cardCount).toBe(6);
  });

  it("reports zero card count for a deck with no cards yet", () => {
    const id = createDeck({ name: "Empty" });
    expect(getDeckSummaryById(id)?.cardCount).toBe(0);
  });

  it("lists decks newest-updated first", () => {
    const first = createDeck({ name: "First" });
    const second = createDeck({ name: "Second" });

    // datetime('now') only has second-level resolution, so set explicit,
    // unambiguously-ordered timestamps rather than relying on timing.
    db.runSync("UPDATE decks SET updated_at = ? WHERE id = ?", [
      "2024-01-01 00:00:00",
      first,
    ]);
    db.runSync("UPDATE decks SET updated_at = ? WHERE id = ?", [
      "2024-01-02 00:00:00",
      second,
    ]);

    const decks = getDecks();
    expect(decks.map((d) => d.id)).toEqual([second, first]);
  });
});

describe("setDeckCardQuantity", () => {
  it("inserts a new deck_cards row", () => {
    const id = createDeck({ name: "Deck" });
    setDeckCardQuantity(id, "OP01-002", 4);

    const cards = getDeckCards(id);
    expect(cards).toHaveLength(1);
    expect(cards[0].quantity).toBe(4);
  });

  it("updates quantity on an existing row instead of duplicating it", () => {
    const id = createDeck({ name: "Deck" });
    setDeckCardQuantity(id, "OP01-002", 2);
    setDeckCardQuantity(id, "OP01-002", 4);

    const cards = getDeckCards(id);
    expect(cards).toHaveLength(1);
    expect(cards[0].quantity).toBe(4);
  });

  it("removes the row once quantity drops to zero", () => {
    const id = createDeck({ name: "Deck" });
    setDeckCardQuantity(id, "OP01-002", 2);
    setDeckCardQuantity(id, "OP01-002", 0);

    expect(getDeckCards(id)).toHaveLength(0);
  });
});

describe("getDeckCards", () => {
  it("joins card info and sorts by cost ascending", () => {
    upsertCards([
      makeCard({ id: "OP01-002", name: "Roronoa Zoro", type: "Character", cost: 2 }),
      makeCard({ id: "OP01-003", name: "Nami", type: "Character", cost: 1 }),
    ]);
    const id = createDeck({ name: "Deck" });
    setDeckCardQuantity(id, "OP01-002", 1);
    setDeckCardQuantity(id, "OP01-003", 1);

    const cards = getDeckCards(id);
    expect(cards.map((c) => c.name)).toEqual(["Nami", "Roronoa Zoro"]);
  });

  it("breaks a cost tie by name ascending", () => {
    const id = createDeck({ name: "Deck" });
    setDeckCardQuantity(id, "OP01-002", 1);
    setDeckCardQuantity(id, "OP01-003", 1);

    const cards = getDeckCards(id);
    expect(cards.map((c) => c.name)).toEqual(["Nami", "Roronoa Zoro"]);
  });
});

describe("updateDeckMeta", () => {
  it("renames a deck and can change its leader", () => {
    const id = createDeck({ name: "Old Name" });
    updateDeckMeta(id, { name: "New Name", leaderId: "OP01-001" });

    const deck = getDeckById(id);
    expect(deck?.name).toBe("New Name");
    expect(deck?.leader_id).toBe("OP01-001");
  });
});

describe("deleteDeck", () => {
  it("removes the deck and cascades to its deck_cards rows", () => {
    const id = createDeck({ name: "Deck" });
    setDeckCardQuantity(id, "OP01-002", 4);

    deleteDeck(id);

    expect(getDeckById(id)).toBeNull();
    expect(getDeckCards(id)).toHaveLength(0);
  });
});
