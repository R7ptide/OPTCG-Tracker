import {
  cardImageUrl,
  getSetLabel,
  isAlternateArt,
  resolveCardImage,
} from "../../utils/cards";

describe("cardImageUrl", () => {
  it("builds the official card list image URL for an id", () => {
    expect(cardImageUrl("OP01-001")).toBe(
      "https://en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png",
    );
  });
});

describe("resolveCardImage", () => {
  it("prefers a stored url when present", () => {
    expect(resolveCardImage("OP01-001", "https://example.com/custom.png")).toBe(
      "https://example.com/custom.png",
    );
  });

  it("falls back to the official url when stored url is missing or empty", () => {
    expect(resolveCardImage("OP01-001", null)).toBe(cardImageUrl("OP01-001"));
    expect(resolveCardImage("OP01-001", "")).toBe(cardImageUrl("OP01-001"));
    expect(resolveCardImage("OP01-001")).toBe(cardImageUrl("OP01-001"));
  });
});

describe("getSetLabel", () => {
  it("extracts the set prefix from a card id", () => {
    expect(getSetLabel("OP01-001")).toBe("OP01");
    expect(getSetLabel("ST13-016")).toBe("ST13");
  });

  it("returns the whole id unchanged when there is no dash", () => {
    expect(getSetLabel("weird")).toBe("weird");
  });
});

describe("isAlternateArt", () => {
  it("treats a bare base id as normal art", () => {
    expect(isAlternateArt("OP01-001")).toBe(false);
  });

  it("flags parallel art variants", () => {
    expect(isAlternateArt("OP01-001_p1")).toBe(true);
    expect(isAlternateArt("OP01-001_p12")).toBe(true);
  });

  it("flags manually-added illustration variants", () => {
    expect(isAlternateArt("ST17-004_m1")).toBe(true);
  });

  it("does not flag ids with an unrelated underscore suffix", () => {
    expect(isAlternateArt("OP01-001_r1")).toBe(false);
  });
});
