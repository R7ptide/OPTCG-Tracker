export const cardImageUrl = (cardId: string): string =>
  `https://en.onepiece-cardgame.com/images/cardlist/card/${cardId}.png`;

// Prefers the image URL stored on the card (from the punk-records source or
// a manual entry) since some cards - especially manually-added alt arts -
// aren't hosted at the official site's predictable URL formula.
export const resolveCardImage = (
  cardId: string,
  storedUrl?: string | null,
): string => storedUrl || cardImageUrl(cardId);

export const getSetLabel = (cardId: string): string => cardId.split("-")[0] ?? "";
