import { DECK_SIZE, getCardCopyLimit } from "../constants/deckRules";

export const splitColors = (color: string | null | undefined): string[] =>
  (color ?? "")
    .split("/")
    .map((c) => c.trim())
    .filter(Boolean);

export const isColorLegal = (
  cardColor: string | null | undefined,
  leaderColor: string | null | undefined,
): boolean => {
  const leaderColors = splitColors(leaderColor);
  if (leaderColors.length === 0) return true;
  return splitColors(cardColor).some((c) => leaderColors.includes(c));
};

export type DeckValidationCard = {
  cardId: string;
  quantity: number;
  color: string | null;
};

export type DeckValidationResult = {
  totalCount: number;
  isComplete: boolean;
  errors: string[];
};

export const validateDeck = (
  leaderColor: string | null | undefined,
  cards: DeckValidationCard[],
): DeckValidationResult => {
  const cardErrors: string[] = [];
  let totalCount = 0;

  for (const card of cards) {
    totalCount += card.quantity;

    const limit = getCardCopyLimit(card.cardId);
    if (card.quantity > limit) {
      cardErrors.push(`${card.cardId} exceeds the ${limit}-copy limit.`);
    }

    if (!isColorLegal(card.color, leaderColor)) {
      cardErrors.push(`${card.cardId} does not match the leader's color.`);
    }
  }

  const errors = [...cardErrors];
  if (totalCount !== DECK_SIZE) {
    errors.push(`Deck has ${totalCount}/${DECK_SIZE} cards.`);
  }

  return {
    totalCount,
    isComplete: totalCount === DECK_SIZE && cardErrors.length === 0,
    errors,
  };
};
