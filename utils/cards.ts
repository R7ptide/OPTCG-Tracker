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

// Alt-art/parallel (`_p1`) and manually-added illustration variants (`_m1`)
// share the same base "SET-NUM" id with a suffix appended.
export const isAlternateArt = (cardId: string): boolean =>
  /_[pm]\d+$/.test(cardId);

// One "<qty>x <Name> <SET-NUM>" line per card, the format Cardmarket's
// wants-list importer accepts.
export const formatCardmarketList = (
  items: { id: string; name: string; quantity: number }[],
): string =>
  items.map((i) => `${i.quantity}x ${i.name} ${i.id}`).join("\n");
