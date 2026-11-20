import {
  getRarityCode,
  getStatTiles,
  getTraitsLine,
  splitList,
} from "../../utils/cardDisplay";

const base = {
  type: "Character",
  cost: 3,
  power: 4000,
  attribute: "Strike",
  color: "Red",
  counter: 1000,
};

describe("splitList", () => {
  it("splits a '/'-joined list and drops empties", () => {
    expect(splitList("Red/Blue")).toEqual(["Red", "Blue"]);
    expect(splitList("")).toEqual([]);
  });
});

describe("getTraitsLine", () => {
  it("joins traits with a middle dot", () => {
    expect(getTraitsLine("Animal/Alabasta")).toBe("Animal · Alabasta");
    expect(getTraitsLine("")).toBe("");
  });
});

describe("getRarityCode", () => {
  it("maps the full rarity to its short code", () => {
    expect(getRarityCode("SuperRare")).toBe("SR");
    expect(getRarityCode("Leader")).toBe("L");
  });

  it("is empty for an unknown rarity", () => {
    expect(getRarityCode("Mystery")).toBe("");
  });
});

describe("getStatTiles", () => {
  it("builds the tiles in order with color dots for the color tile", () => {
    const tiles = getStatTiles({ ...base, color: "Red/Blue" });

    expect(tiles.map((t) => t.label)).toEqual([
      "Cost",
      "Power",
      "Color",
      "Counter",
      "Attribute",
    ]);
    expect(tiles[2]).toEqual({
      label: "Color",
      value: "Red / Blue",
      colors: ["Red", "Blue"],
    });
  });

  it("labels a Leader's cost as Life", () => {
    const [first] = getStatTiles({ ...base, type: "Leader", cost: 4 });

    expect(first).toEqual({ label: "Life", value: "4" });
  });

  it("shows a printed power of 0 for Characters and Leaders", () => {
    for (const type of ["Character", "Leader"]) {
      const tiles = getStatTiles({ ...base, type, power: 0 });

      expect(tiles.find((t) => t.label === "Power")).toEqual({
        label: "Power",
        value: "0",
      });
    }
  });

  it("leaves out tiles with no value", () => {
    const tiles = getStatTiles({
      type: "Event",
      cost: null,
      power: 0,
      attribute: "",
      color: "Green",
      counter: null,
    });

    expect(tiles.map((t) => t.label)).toEqual(["Color"]);
  });
});
