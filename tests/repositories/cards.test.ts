import { initDB } from "../../database";
import db from "../../database";
import type { CardRow } from "../../database";
import {
  getAllLeaders,
  getCardsByColors,
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
  traits: null,
  counter: null,
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

  it("lists a whole set by id prefix, case-insensitively, ordered by id", () => {
    expect(searchCardsByName("op01").map((c) => c.id)).toEqual([
      "OP01-001",
      "OP01-002",
    ]);
    expect(searchCardsByName("OP01").map((c) => c.id)).toEqual([
      "OP01-001",
      "OP01-002",
    ]);
  });

  it("finds a single card by full id", () => {
    expect(searchCardsByName("op02-050").map((c) => c.id)).toEqual([
      "OP02-050",
    ]);
  });

  it("returns nothing for a non-matching name", () => {
    expect(searchCardsByName("Nefertari")).toHaveLength(0);
  });

  it("does not cap the number of results", () => {
    upsertCards(
      Array.from({ length: 150 }, (_, i) =>
        makeCard({ id: `OP09-${String(i).padStart(3, "0")}`, name: "Zzz Bulk" }),
      ),
    );
    expect(searchCardsByName("Zzz Bulk")).toHaveLength(150);
  });
});

describe("getAllLeaders", () => {
  beforeEach(() => {
    upsertCards([
      makeCard({ id: "OP01-001", name: "Luffy", type: "Leader" }),
      makeCard({ id: "OP01-001_p1", name: "Luffy", type: "Leader" }),
      makeCard({ id: "ST17-004_m1", name: "Manual Alt", type: "Leader" }),
      makeCard({ id: "OP01-002", name: "Zoro", type: "Character" }),
    ]);
  });

  it("only returns Leader-type cards", () => {
    const leaders = getAllLeaders();
    expect(leaders.every((l) => l.type === "Leader")).toBe(true);
  });

  it("excludes parallel and manually-added alt-art variants", () => {
    const ids = getAllLeaders().map((l) => l.id);
    expect(ids).toEqual(["OP01-001"]);
  });
});

describe("getCardsByColors", () => {
  beforeEach(() => {
    upsertCards([
      makeCard({ id: "OP01-001", name: "Luffy", type: "Leader", color: "Red" }),
      makeCard({
        id: "OP01-002",
        name: "Zoro",
        type: "Character",
        color: "Red",
        cost: 3,
      }),
      makeCard({
        id: "OP01-003",
        name: "Sanji",
        type: "Character",
        color: "Red/Green",
        cost: 1,
      }),
      makeCard({
        id: "OP01-004",
        name: "Nami",
        type: "Character",
        color: "Blue",
        cost: 2,
      }),
    ]);
  });

  it("returns an empty list when no colors are given", () => {
    expect(getCardsByColors([])).toHaveLength(0);
  });

  it("matches cards sharing any of the given colors", () => {
    const ids = getCardsByColors(["Red"]).map((c) => c.id);
    expect(ids.sort()).toEqual(["OP01-002", "OP01-003"]);
  });

  it("excludes Leader-type cards even if the color matches", () => {
    const ids = getCardsByColors(["Red"]).map((c) => c.id);
    expect(ids).not.toContain("OP01-001");
  });

  it("orders results by cost ascending", () => {
    const ids = getCardsByColors(["Red", "Blue"]).map((c) => c.id);
    expect(ids).toEqual(["OP01-003", "OP01-004", "OP01-002"]);
  });
});
