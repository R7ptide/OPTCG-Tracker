import {
  isColorLegal,
  splitColors,
  validateDeck,
} from "../../utils/deckValidation";
import { DECK_SIZE } from "../../constants/deckRules";

describe("splitColors", () => {
  it("splits a slash-joined color string", () => {
    expect(splitColors("Red/Green")).toEqual(["Red", "Green"]);
  });

  it("returns a single-element array for a single color", () => {
    expect(splitColors("Red")).toEqual(["Red"]);
  });

  it("trims whitespace around each color", () => {
    expect(splitColors("Red / Green")).toEqual(["Red", "Green"]);
  });

  it("returns an empty array for null, undefined, or empty input", () => {
    expect(splitColors(null)).toEqual([]);
    expect(splitColors(undefined)).toEqual([]);
    expect(splitColors("")).toEqual([]);
  });
});

describe("isColorLegal", () => {
  it("allows a card whose color matches the leader exactly", () => {
    expect(isColorLegal("Red", "Red")).toBe(true);
  });

  it("allows a card with any color overlap with a dual-color leader", () => {
    expect(isColorLegal("Green", "Red/Green")).toBe(true);
    expect(isColorLegal("Red", "Red/Green")).toBe(true);
  });

  it("rejects a card with no overlapping color", () => {
    expect(isColorLegal("Blue", "Red/Green")).toBe(false);
  });

  it("allows anything when no leader color is set", () => {
    expect(isColorLegal("Blue", null)).toBe(true);
    expect(isColorLegal("Blue", undefined)).toBe(true);
  });
});

describe("validateDeck", () => {
  const fullLegalDeck = (count: number) => [
    { cardId: "OP01-002", quantity: count, color: "Red" },
  ];

  it("flags an incomplete deck and reports the running total", () => {
    const result = validateDeck("Red", fullLegalDeck(4));
    expect(result.totalCount).toBe(4);
    expect(result.isComplete).toBe(false);
    expect(result.errors).toContain(`Deck has 4/${DECK_SIZE} cards.`);
  });

  it("marks a deck complete at exactly 50 legal cards with no violations", () => {
    // 12 distinct cards at the 4-copy cap (48) + 1 card at 2 copies = 50,
    // staying within the copy limit on every entry.
    const cards = [
      ...Array.from({ length: 12 }, (_, i) => ({
        cardId: `OP01-${String(i + 1).padStart(3, "0")}`,
        quantity: 4,
        color: "Red",
      })),
      { cardId: "OP01-013", quantity: 2, color: "Red" },
    ];
    const result = validateDeck("Red", cards);
    expect(result.totalCount).toBe(50);
    expect(result.isComplete).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("flags a card that exceeds the copy limit", () => {
    const result = validateDeck("Red", [
      { cardId: "OP01-002", quantity: 5, color: "Red" },
    ]);
    expect(result.errors).toContain("OP01-002 exceeds the 4-copy limit.");
    expect(result.isComplete).toBe(false);
  });

  it("flags a card whose color doesn't match the leader", () => {
    const result = validateDeck("Red", [
      { cardId: "OP01-002", quantity: 4, color: "Blue" },
    ]);
    expect(result.errors).toContain(
      "OP01-002 does not match the leader's color.",
    );
  });

  it("never blocks completion status purely on total count when copy/color errors exist", () => {
    // 50 total cards, but one entry breaks the copy limit - must not be
    // reported as "complete" even though totalCount === DECK_SIZE.
    const cards = [
      { cardId: "OP01-002", quantity: 5, color: "Red" },
      { cardId: "OP01-003", quantity: 45, color: "Red" },
    ];
    const result = validateDeck("Red", cards);
    expect(result.totalCount).toBe(50);
    expect(result.isComplete).toBe(false);
  });
});
