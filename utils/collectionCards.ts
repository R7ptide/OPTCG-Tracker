import { type MasterCardRow } from "../repositories/cards";
import { type CollectionCard } from "../components/CardModal";
import { cardImageUrl } from "./cards";

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
