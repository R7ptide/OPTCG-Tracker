import { type CardRow } from "../database";
import { upsertCards } from "../repositories/cards";
import { MANUAL_CARDS, type PunkRecordCard } from "../constants/manualCards";

const CARDS_JSON_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english/index/cards_by_id.json";

type PunkRecordDict = Record<string, PunkRecordCard>;

export const useSync = () => {
  const syncMasterList = async (): Promise<boolean> => {
    try {
      console.log("Fetching master list from punk-records...");
      const response = await fetch(CARDS_JSON_URL);
      const cardsData: PunkRecordDict = await response.json();

      const manualEntries = Object.entries(MANUAL_CARDS).filter(
        ([cardId]) => !cardsData[cardId],
      );
      const cardEntries = [...Object.entries(cardsData), ...manualEntries];

      console.log(
        `Downloaded ${cardEntries.length - manualEntries.length} cards from punk-records, ` +
          `added ${manualEntries.length} manual entries. Updating database...`,
      );

      const cards: CardRow[] = cardEntries
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
        }));

      upsertCards(cards);

      console.log("Sync complete!");
      return true;
    } catch (error) {
      console.error("Failed to sync master list:", error);
      return false;
    }
  };

  return { syncMasterList };
};
