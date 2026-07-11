import { initDB } from "../../database";
import db from "../../database";
import type { CardRow } from "../../database";
import {
  getTotalCardCount,
  getCardCountForSet,
  getCardsForSet,
  searchCardsByName,
  upsertCards,
} from "../../repositories/cards";

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
  db.execSync("DELETE FROM collection; DELETE FROM cards;");
});

describe("upsertCards", () => {
  it("inserts new cards", () => {
    upsertCards([makeCard({ id: "OP01-001", name: "Monkey D. Luffy", set_id: "OP01" })]);
    expect(getTotalCardCount()).toBe(1);
  });

  it("replaces existing card data instead of duplicating rows", () => {
    upsertCards([makeCard({ id: "OP01-001", name: "Old Name", set_id: "OP01" })]);
    upsertCards([makeCard({ id: "OP01-001", name: "New Name", set_id: "OP01" })]);

    expect(getTotalCardCount()).toBe(1);
    expect(getCardsForSet("OP01")[0].name).toBe("New Name");
  });
});

describe("getCardCountForSet / getCardsForSet", () => {
  beforeEach(() => {
    upsertCards([
      makeCard({ id: "OP01-002", name: "Zoro", set_id: "OP01" }),
      makeCard({ id: "OP01-001", name: "Luffy", set_id: "OP01" }),
      makeCard({ id: "OP02-001", name: "Sanji", set_id: "OP02" }),
    ]);
  });

  it("counts cards scoped to a single set", () => {
    expect(getCardCountForSet("OP01")).toBe(2);
    expect(getCardCountForSet("OP02")).toBe(1);
    expect(getCardCountForSet("OP03")).toBe(0);
  });

  it("returns cards for a set ordered by id ascending", () => {
    const cards = getCardsForSet("OP01");
    expect(cards.map((c) => c.id)).toEqual(["OP01-001", "OP01-002"]);
  });
});

describe("searchCardsByName", () => {
  beforeEach(() => {
    upsertCards([
      makeCard({ id: "OP01-001", name: "Monkey D. Luffy", set_id: "OP01" }),
      makeCard({ id: "OP02-050", name: "Monkey D. Garp", set_id: "OP02" }),
      makeCard({ id: "OP01-002", name: "Roronoa Zoro", set_id: "OP01" }),
    ]);
  });

  it("matches a substring across all sets, case-insensitively", () => {
    const results = searchCardsByName("monkey");
    expect(results.map((c) => c.id).sort()).toEqual(["OP01-001", "OP02-050"]);
  });

  it("returns nothing for a non-matching name", () => {
    expect(searchCardsByName("Nefertari")).toHaveLength(0);
  });

  it("respects the limit parameter", () => {
    expect(searchCardsByName("o", 1)).toHaveLength(1);
  });
});
