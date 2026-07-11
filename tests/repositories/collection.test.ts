import { initDB } from "../../database";
import { upsertCards } from "../../repositories/cards";
import type { CardRow } from "../../database";
import {
  getCollectionStats,
  getSetOwnedCount,
  getOwnedForSet,
  getQuantity,
  incrementCard,
  decrementCard,
  getAllCollectionRows,
  wipeCollection,
  restoreCollection,
} from "../../repositories/collection";
import db from "../../database";

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
  upsertCards([
    makeCard({ id: "OP01-001", set_id: "OP01" }),
    makeCard({ id: "OP01-002", set_id: "OP01" }),
    makeCard({ id: "OP02-001", set_id: "OP02" }),
  ]);
});

describe("collection stats", () => {
  it("returns zero when nothing owned", () => {
    expect(getCollectionStats()).toEqual({ unique: 0, total: 0 });
  });

  it("counts unique cards and total quantity across increments", () => {
    incrementCard("OP01-001");
    incrementCard("OP01-001");
    incrementCard("OP01-002");

    expect(getCollectionStats()).toEqual({ unique: 2, total: 3 });
  });
});

describe("incrementCard / decrementCard", () => {
  it("creates a row with quantity 1 on first increment", () => {
    incrementCard("OP01-001");
    expect(getQuantity("OP01-001")).toBe(1);
  });

  it("accumulates quantity across repeated increments", () => {
    incrementCard("OP01-001");
    incrementCard("OP01-001");
    incrementCard("OP01-001");
    expect(getQuantity("OP01-001")).toBe(3);
  });

  it("decrements quantity without dropping below zero rows", () => {
    incrementCard("OP01-001");
    incrementCard("OP01-001");
    decrementCard("OP01-001");
    expect(getQuantity("OP01-001")).toBe(1);
  });

  it("removes the row once quantity reaches zero", () => {
    incrementCard("OP01-001");
    decrementCard("OP01-001");
    expect(getQuantity("OP01-001")).toBe(0);
    expect(getAllCollectionRows()).toHaveLength(0);
  });

  it("is a no-op when decrementing a card that isn't owned", () => {
    decrementCard("OP01-001");
    expect(getQuantity("OP01-001")).toBe(0);
  });
});

describe("getSetOwnedCount / getOwnedForSet", () => {
  it("only counts owned cards belonging to the given set", () => {
    incrementCard("OP01-001");
    incrementCard("OP02-001");

    expect(getSetOwnedCount("OP01")).toBe(1);
    expect(getSetOwnedCount("OP02")).toBe(1);
    expect(getSetOwnedCount("OP03")).toBe(0);
  });

  it("returns owned rows scoped to a set id prefix", () => {
    incrementCard("OP01-001");
    incrementCard("OP01-002");
    incrementCard("OP02-001");

    const owned = getOwnedForSet("OP01");
    expect(owned.map((r) => r.card_id).sort()).toEqual([
      "OP01-001",
      "OP01-002",
    ]);
  });
});

describe("wipeCollection / restoreCollection", () => {
  it("wipes all owned cards", () => {
    incrementCard("OP01-001");
    incrementCard("OP02-001");
    wipeCollection();
    expect(getAllCollectionRows()).toHaveLength(0);
  });

  it("restores from a backup, replacing any existing collection", () => {
    incrementCard("OP01-001");

    restoreCollection([
      { card_id: "OP01-002", quantity: 4 },
      { card_id: "OP02-001", quantity: 2 },
    ]);

    const rows = getAllCollectionRows();
    expect(rows).toHaveLength(2);
    expect(getQuantity("OP01-001")).toBe(0);
    expect(getQuantity("OP01-002")).toBe(4);
    expect(getQuantity("OP02-001")).toBe(2);
  });

  it("skips malformed rows (missing id or zero quantity) on restore", () => {
    restoreCollection([
      { card_id: "OP01-001", quantity: 0 },
      { card_id: "", quantity: 3 },
      { card_id: "OP01-002", quantity: 1 },
    ]);

    const rows = getAllCollectionRows();
    expect(rows).toHaveLength(1);
    expect(getQuantity("OP01-002")).toBe(1);
  });
});
