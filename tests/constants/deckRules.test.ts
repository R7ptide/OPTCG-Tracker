import {
  DECK_SIZE,
  MAX_COPIES,
  UNLIMITED_COPY_CARD_IDS,
  getCardCopyLimit,
} from "../../constants/deckRules";

describe("getCardCopyLimit", () => {
  it("returns the standard 4-copy limit for an ordinary card", () => {
    expect(getCardCopyLimit("OP01-002")).toBe(MAX_COPIES);
  });

  it("returns Infinity for a card on the unlimited-copy override list", () => {
    UNLIMITED_COPY_CARD_IDS.add("OP01-999");
    try {
      expect(getCardCopyLimit("OP01-999")).toBe(Infinity);
    } finally {
      UNLIMITED_COPY_CARD_IDS.delete("OP01-999");
    }
  });
});

describe("DECK_SIZE", () => {
  it("is the standard 50-card main deck size", () => {
    expect(DECK_SIZE).toBe(50);
  });
});
