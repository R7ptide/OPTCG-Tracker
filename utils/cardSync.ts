import { type CardRow } from "../database";
import { MANUAL_CARDS, type PunkRecordCard } from "../constants/manualCards";

export type PunkRecordDict = Record<string, PunkRecordCard>;

export type ServerVersion = {
  commit: string;
  updated_at: string;
};

// A device that never synced has no stored commit, so it counts as outdated.
export const isUpdateAvailable = (
  localCommit: string | null,
  serverCommit: string,
): boolean => localCommit !== serverCommit;

// Remote data always wins over a manual entry for the same id.
export const toCardRows = (cardsData: PunkRecordDict): CardRow[] => {
  const manualEntries = Object.entries(MANUAL_CARDS).filter(
    ([cardId]) => !cardsData[cardId],
  );

  return [...Object.entries(cardsData), ...manualEntries]
    .filter(([cardId]) => !cardId.includes("_r"))
    .map(([cardId, card]) => ({
      id: cardId,
      name: card.name ?? "Unknown",
      color: card.colors ? card.colors.join("/") : "",
      type: card.category ?? "",
      cost: card.cost ?? 0,
      power: card.power ?? 0,
      attribute: card.attributes ? card.attributes.join("/") : "",
      rarity: card.rarity ?? "",
      image_url: card.img_url ?? "",
      set_id: cardId.split("-")[0],
      traits: card.types ? card.types.join("/") : "",
      counter: card.counter ?? null,
    }));
};
