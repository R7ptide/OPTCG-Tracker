import { parseEffectText } from "../../utils/effectText";
import { getKeywordStyle } from "../../constants/keywordStyles";

describe("getKeywordStyle", () => {
  it("styles DON!! costs as black squares", () => {
    for (const tag of ["DON!! x1", "DON!! x2", "DON!! -1"]) {
      expect(getKeywordStyle(tag)).toMatchObject({
        shape: "square",
        background: "#111111",
      });
    }
  });

  it("groups the keywords by color and shape", () => {
    expect(getKeywordStyle("Trigger")?.background).toBe("#facc15");
    expect(getKeywordStyle("Counter")).toMatchObject({
      shape: "square",
      background: "#dc2626",
    });
    expect(getKeywordStyle("Once Per Turn")).toMatchObject({
      shape: "rounded",
      background: "#dc2626",
    });
    for (const tag of [
      "Blocker",
      "Banish",
      "Double Attack",
      "Rush",
      "Unblockable",
    ]) {
      expect(getKeywordStyle(tag)?.background).toBe("#ea580c");
    }
    for (const tag of [
      "Activate: Main",
      "When Attacking",
      "On K.O.",
      "On Play",
      "End of Your Turn",
      "Main",
      "Opponent's Turn",
    ]) {
      expect(getKeywordStyle(tag)?.background).toBe("#2563eb");
    }
  });

  it("has no style for card names", () => {
    expect(getKeywordStyle("Sanji")).toBeNull();
  });
});

describe("parseEffectText", () => {
  it("splits keywords from the surrounding text", () => {
    const segments = parseEffectText("[On Play] Draw 1 card.");

    expect(segments.map((s) => [s.type, s.text])).toEqual([
      ["keyword", "On Play"],
      ["text", " Draw 1 card."],
    ]);
  });

  it("keeps unstyled brackets as plain text, merged with their neighbours", () => {
    const segments = parseEffectText("Give [Sanji] +1000 power. [Blocker]");

    expect(segments.map((s) => [s.type, s.text])).toEqual([
      ["text", "Give [Sanji] +1000 power. "],
      ["keyword", "Blocker"],
    ]);
  });

  it("handles several keywords in a row", () => {
    const segments = parseEffectText(
      "[DON!! x1] [Your Turn] [Once Per Turn] Go.",
    );

    expect(segments.filter((s) => s.type === "keyword")).toHaveLength(3);
  });

  it("returns a single text segment when there are no brackets", () => {
    expect(parseEffectText("Just text.")).toEqual([
      { type: "text", text: "Just text." },
    ]);
  });

  it("returns nothing for empty text", () => {
    expect(parseEffectText("")).toEqual([]);
  });
});
