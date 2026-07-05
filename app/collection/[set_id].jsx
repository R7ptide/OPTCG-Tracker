import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "../_layout";
import db from "../../database";

export default function SetDetails() {
  const { set_id } = useLocalSearchParams();
  const { showMissing } = useContext(SettingsContext);
  const [cardsToDisplay, setCardsToDisplay] = useState([]);

  // This state controls our popup! If it has a card, the modal opens.
  const [selectedCard, setSelectedCard] = useState(null);

  // We wrap the data loading in a function so we can call it after pressing +/-
  const fetchCards = () => {
    const ownedData = db.getAllSync(
      "SELECT card_id, quantity FROM collection WHERE card_id LIKE ?",
      [`${set_id}-%`],
    );
    const ownedMap = {};
    ownedData.forEach((row) => {
      ownedMap[row.card_id] = row.quantity;
    });

    const masterData = db.getAllSync(
      "SELECT id, color, image_url FROM cards WHERE set_id = ? ORDER BY id ASC",
      [set_id],
    );

    const masterList = masterData.map((row) => ({
      id: row.id,
      color: row.color,
      imageUrl: `https://en.onepiece-cardgame.com/images/cardlist/card/${row.id}.png`,
      owned: ownedMap[row.id] > 0,
      quantity: ownedMap[row.id] || 0,
    }));

    if (showMissing) setCardsToDisplay(masterList);
    else setCardsToDisplay(masterList.filter((card) => card.owned));
  };

  useEffect(() => {
    fetchCards();
  }, [set_id, showMissing]);

  // --- DATABASE LOGIC FOR PLUS / MINUS BUTTONS ---
  const handleIncrement = () => {
    if (!selectedCard) return;
    const cardId = selectedCard.id;

    // Check if you already own at least one
    const existing = db.getFirstSync(
      "SELECT quantity FROM collection WHERE card_id = ?",
      [cardId],
    );

    if (existing) {
      db.runSync(
        "UPDATE collection SET quantity = quantity + 1 WHERE card_id = ?",
        [cardId],
      );
    } else {
      db.runSync("INSERT INTO collection (card_id, quantity) VALUES (?, 1)", [
        cardId,
      ]);
    }

    // Instantly update the modal text and refresh the background grid
    setSelectedCard((prev) => ({
      ...prev,
      quantity: prev.quantity + 1,
      owned: true,
    }));
    fetchCards();
  };

  const handleDecrement = () => {
    if (!selectedCard || selectedCard.quantity === 0) return; // Can't go below 0
    const cardId = selectedCard.id;

    const existing = db.getFirstSync(
      "SELECT quantity FROM collection WHERE card_id = ?",
      [cardId],
    );

    if (existing) {
      if (existing.quantity > 1) {
        db.runSync(
          "UPDATE collection SET quantity = quantity - 1 WHERE card_id = ?",
          [cardId],
        );
      } else {
        db.runSync("DELETE FROM collection WHERE card_id = ?", [cardId]); // Remove entirely if 0
      }

      const newQty = selectedCard.quantity - 1;
      setSelectedCard((prev) => ({
        ...prev,
        quantity: newQty,
        owned: newQty > 0,
      }));
      fetchCards();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{set_id} Collection</Text>

      <FlatList
        data={cardsToDisplay}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          // 1. Wrap the card in a TouchableOpacity to trigger the modal
          <TouchableOpacity
            style={styles.cardSlot}
            onPress={() => setSelectedCard(item)}
          >
            <Image
              source={{ uri: item.imageUrl }}
              style={[
                styles.cardImage,
                item.owned ? styles.imageOwned : styles.imageMissing,
              ]}
              resizeMode="contain"
            />
            {item.owned && (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>x{item.quantity}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No cards owned in this set.</Text>
        }
      />

      {/* 2. THE POPUP MODAL */}
      <Modal visible={!!selectedCard} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          {/* Invisible button behind the card so clicking the background closes the modal */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedCard(null)}
          />

          {selectedCard && (
            <View style={styles.modalContent}>
              {/* Always show the card in full, vibrant color in the modal */}
              <Image
                source={{ uri: selectedCard.imageUrl }}
                style={styles.modalLargeImage}
                resizeMode="contain"
              />

              {/* The + / - Controls */}
              <View style={styles.controlsContainer}>
                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={handleDecrement}
                >
                  <Text style={styles.circleBtnText}>-</Text>
                </TouchableOpacity>

                <View style={styles.qtyDisplay}>
                  <Text style={styles.qtyValue}>{selectedCard.quantity}</Text>
                  <Text style={styles.qtyLabel}>Owned</Text>
                </View>

                <TouchableOpacity
                  style={styles.circleBtn}
                  onPress={handleIncrement}
                >
                  <Text style={styles.circleBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 10 },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },

  // Grid Styling
  cardSlot: {
    flex: 1,
    margin: 5,
    aspectRatio: 0.7,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: { width: "100%", height: "100%", borderRadius: 8 },
  imageOwned: { opacity: 1 },
  imageMissing: { opacity: 0.2 },
  qtyBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyText: { color: "#4ade80", fontSize: 12, fontWeight: "bold" },
  empty: { color: "#888", textAlign: "center", marginTop: 50 },

  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "85%", alignItems: "center" },
  modalLargeImage: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 15,
    marginBottom: 30,
  },

  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 50,
    gap: 30,
    borderWidth: 1,
    borderColor: "#333",
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6b21a8",
    justifyContent: "center",
    alignItems: "center",
  },
  circleBtnText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    lineHeight: 35,
  },
  qtyDisplay: { alignItems: "center", width: 60 },
  qtyValue: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  qtyLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
});
