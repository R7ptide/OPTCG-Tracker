import db from "../database";

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

      db.withTransactionSync(() => {
        const insertStmt = db.prepareSync(`
          INSERT OR REPLACE INTO cards
          (id, name, color, type, cost, power, attribute, rarity, image_url, set_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const [cardId, card] of cardEntries) {
          const setId = cardId.split("-")[0];

          insertStmt.executeSync([
            cardId,
            card.name ?? "Unknown",
            card.colors ? card.colors.join("/") : "",
            card.category ?? "",
            card.cost ?? 0,
            card.power ?? 0,
            card.attributes ? card.attributes.join("/") : "",
            card.rarity ?? "",
            card.img_full_url ?? "",
            setId,
          ]);
        }
      });

      console.log("Sync complete!");
      return true;
    } catch (error) {
      console.error("Failed to sync master list:", error);
      return false;
    }
  };

  return { syncMasterList };
};
