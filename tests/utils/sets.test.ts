import { parseSets, type PacksJson } from "../../utils/sets";

const packs = (labels: (string | null)[]): PacksJson =>
  Object.fromEntries(
    labels.map((label, i) => [String(i), { title_parts: { label } }]),
  );

describe("parseSets", () => {
  it("groups labels by set type, ordered by number", () => {
    const result = parseSets(
      packs(["OP-02", "ST-10", "OP-01", "EB-01", "PRB-01", "ST-02"]),
    );

    expect(result).toEqual({
      mainSets: ["OP01", "OP02"],
      extraBoosters: ["EB01"],
      starterDecks: ["ST02", "ST10"],
      premiumBoosters: ["PRB01"],
    });
  });

  it("reads every set in a combined label like OP14-EB04", () => {
    const result = parseSets(packs(["OP-13", "OP14-EB04", "OP15-EB04"]));

    expect(result.mainSets).toEqual(["OP13", "OP14", "OP15"]);
    expect(result.extraBoosters).toEqual(["EB04"]);
  });

  it("skips packs without a label", () => {
    const result = parseSets({
      a: { title_parts: { label: null } },
      b: {},
      c: { title_parts: { label: "OP-01" } },
    });

    expect(result.mainSets).toEqual(["OP01"]);
  });

  it("returns empty lists for empty input", () => {
    expect(parseSets({})).toEqual({
      mainSets: [],
      extraBoosters: [],
      starterDecks: [],
      premiumBoosters: [],
    });
  });
});
