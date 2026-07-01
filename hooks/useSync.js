import db from "../database";

const CARDS_JSON_URL =
  "https://raw.githubusercontent.com/buhbbl/punk-records/main/english/index/cards_by_id.json";

export const useSync = () => {
  const syncMasterList = async () => {
    try {
      console.log("Fetching master list from punk-records...");
      const response = await fetch(CARDS_JSON_URL);
      const cardsData = await response.json();

      // Get an array of [key, value] pairs so we can use the key as the ID
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

        // Loop through the entries, destructuring the ID and the card details
        for (const [cardId, card] of cardEntries) {
          const setId = cardId.split("-")[0];

          insertStmt.executeSync([
            cardId, // Use the key directly from the JSON
            card.name || "Unknown",
            card.colors ? card.colors.join("/") : "",
            card.category || "",
            card.cost || 0,
            card.power || 0,
            card.attributes ? card.attributes.join("/") : "",
            card.rarity || "",
            card.img_full_url || "",
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
