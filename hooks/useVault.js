import { useState, useEffect } from "react";
import db, { initDB } from "../database";

export const useVault = () => {
  const [collection, setCollection] = useState([]);

  // Initialize DB and fetch cards on load
  useEffect(() => {
    initDB();
    fetchCollection();
  }, []);

  const fetchCollection = () => {
    const result = db.getAllSync("SELECT * FROM collection");
    setCollection(result);
  };

  const addCard = (cardId, quantity) => {
    if (!cardId.trim()) return false;

    const formattedCardId = cardId.trim().toUpperCase();
    const qty = parseInt(quantity) || 1;

    try {
      db.runSync("INSERT OR IGNORE INTO cards (id, name) VALUES (?, ?)", [
        formattedCardId,
        "Unknown Name",
      ]);

      const existing = db.getFirstSync(
        "SELECT * FROM collection WHERE card_id = ?",
        [formattedCardId],
      );

      if (existing) {
        db.runSync(
          "UPDATE collection SET quantity = quantity + ? WHERE card_id = ?",
          [qty, formattedCardId],
        );
      } else {
        db.runSync("INSERT INTO collection (card_id, quantity) VALUES (?, ?)", [
          formattedCardId,
          qty,
        ]);
      }

      fetchCollection();
      return true; // Indicate success to the UI
    } catch (error) {
      console.error("Error adding card:", error);
      return false; // Indicate failure
    }
  };

  return { collection, addCard };
};
