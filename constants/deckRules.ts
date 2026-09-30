export const MAX_COPIES = 4;
export const DECK_SIZE = 50;

// Manually maintained: cards whose printed text overrides the standard 4-copy
// limit (e.g. "You may include any number of this card in your deck"). No
// field in the card data carries rules text, so these ids are tracked by hand,
// same approach as constants/manualCards.ts.
export const UNLIMITED_COPY_CARD_IDS = new Set<string>([]);

export const getCardCopyLimit = (cardId: string): number =>
  UNLIMITED_COPY_CARD_IDS.has(cardId) ? Infinity : MAX_COPIES;
