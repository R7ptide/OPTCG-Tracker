export const cardImageUrl = (cardId: string): string =>
  `https://en.onepiece-cardgame.com/images/cardlist/card/${cardId}.png`;

export const getSetLabel = (cardId: string): string => cardId.split("-")[0] ?? "";
