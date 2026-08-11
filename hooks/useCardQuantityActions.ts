import { type CollectionCard } from "../components/CardModal";
import { incrementCard, decrementCard } from "../repositories/collection";

// Shared increment/decrement handlers for the selected card in a collection
// grid (set details / search), keeping the selected-card preview in sync
// with the DB write and bumping dbVersion so the list re-queries.
export const useCardQuantityActions = (
  selectedCard: CollectionCard | null,
  setSelectedCard: (
    updater: (prev: CollectionCard | null) => CollectionCard | null,
  ) => void,
  bumpDbVersion: () => void,
) => {
  const handleIncrement = () => {
    if (!selectedCard) return;
    incrementCard(selectedCard.id);
    bumpDbVersion();
    setSelectedCard((prev) =>
      prev ? { ...prev, quantity: prev.quantity + 1, owned: true } : prev,
    );
  };

  const handleDecrement = () => {
    if (!selectedCard || selectedCard.quantity === 0) return;
    decrementCard(selectedCard.id);
    bumpDbVersion();
    const newQty = selectedCard.quantity - 1;
    setSelectedCard((prev) =>
      prev ? { ...prev, quantity: newQty, owned: newQty > 0 } : prev,
    );
  };

  return { handleIncrement, handleDecrement };
};
