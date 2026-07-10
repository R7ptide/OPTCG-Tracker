import { type CardRow } from "../database";
import { upsertCards } from "../repositories/cards";

const CARDS_JSON_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english/index/cards_by_id.json";

type PunkRecordCard = {
  name?: string;
  colors?: string[];
  category?: string;
  cost?: number;
  power?: number;
  attributes?: string[];
  rarity?: string;
  img_full_url?: string;
};

type PunkRecordDict = Record<string, PunkRecordCard>;

export const useSync = () => {
  const syncMasterList = async (): Promise<boolean> => {
    try {
      console.log("Fetching master list from punk-records...");
      const response = await fetch(CARDS_JSON_URL);
      const cardsData: PunkRecordDict = await response.json();

      const cardEntries = Object.entries(cardsData);

      console.log(
        `Downloaded ${cardEntries.length} cards. Updating database...`,
      );

      const cards: CardRow[] = cardEntries.map(([cardId, card]) => ({
        id: cardId,
        name: card.name ?? "Unknown",
        color: card.colors ? card.colors.join("/") : "",
        type: card.category ?? "",
        cost: card.cost ?? 0,
        power: card.power ?? 0,
        attribute: card.attributes ? card.attributes.join("/") : "",
        rarity: card.rarity ?? "",
        image_url: card.img_full_url ?? "",
        set_id: cardId.split("-")[0],
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
