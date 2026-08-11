import { type MasterCardRow } from "../repositories/cards";
import { type CollectionCard } from "../components/CardModal";
import { cardImageUrl } from "./cards";
import { RARITY_MAP } from "../constants/gameData";
import { type Filters } from "../hooks/useFilters";

export type OwnedQuantityRow = { card_id: string; quantity: number };

// Merges master card rows with owned quantities into the shape the
// collection/search screens render, computing per-base-card playset totals
// (variants of the same card share a base id like "OP01-001").
export const buildCollectionCards = (
  masterRows: MasterCardRow[],
  ownedRows: OwnedQuantityRow[],
): CollectionCard[] => {
  const ownedMap: Record<string, number> = {};
  const basePlaysetMap: Record<string, number> = {};

  ownedRows.forEach((row) => {
    ownedMap[row.card_id] = row.quantity;
    const baseId = row.card_id.split("_")[0];
    basePlaysetMap[baseId] = (basePlaysetMap[baseId] || 0) + row.quantity;
  });

  return masterRows.map((row) => {
    const baseId = row.id.split("_")[0];
    return {
      id: row.id,
      name: row.name || "",
      color: row.color || "",
      type: row.type || "",
      rarity: row.rarity || "",
      cost: row.cost,
      imageUrl: cardImageUrl(row.id),
      owned: (ownedMap[row.id] ?? 0) > 0,
      quantity: ownedMap[row.id] || 0,
      playsetTotal: basePlaysetMap[baseId] || 0,
    };
  });
};

// Leaders only need 1 copy total (across base/alt art variants) to be
// considered a complete playset; every other card type needs 4.
export const requiredCopiesFor = (card: CollectionCard): number =>
  card.type && card.type.toLowerCase() === "leader" ? 1 : 4;

// Whether a card's base-id group (summed across its art variants) has met
// its playset requirement. Shared by the badge color and the missing-
// playset filter so both stay in sync.
export const isPlaysetComplete = (card: CollectionCard): boolean =>
  card.playsetTotal >= requiredCopiesFor(card);

// Shared card/color/type/rarity filtering used by the set-detail and
// global search screens so filter logic isn't duplicated between them.
export const filterCollectionCards = (
  cards: CollectionCard[],
  filters: Filters,
  options: { showMissing?: boolean } = {},
): CollectionCard[] => {
  const { showMissing = true } = options;

  return cards.filter((card) => {
    if (!showMissing && !card.owned) return false;
    if (
      filters.searchName &&
      !card.name.toLowerCase().includes(filters.searchName.toLowerCase())
    )
      return false;
    if (
      filters.colors.length > 0 &&
      !filters.colors.some((c) => card.color.includes(c))
    )
      return false;
    if (filters.types.length > 0 && !filters.types.includes(card.type))
      return false;

    if (filters.rarities.length > 0) {
      const matchesRarity = filters.rarities.some((shortRarity) => {
        const fullRarity = RARITY_MAP[shortRarity];
        return (
          card.rarity &&
          card.rarity.toLowerCase().includes(fullRarity.toLowerCase())
        );
      });
      if (!matchesRarity) return false;
    }

    if (filters.missingPlayset && isPlaysetComplete(card)) return false;

    return true;
  });
};
