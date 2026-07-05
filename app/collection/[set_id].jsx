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
  const [selectedCard, setSelectedCard] = useState(null);
  const [setStats, setSetStats] = useState({ unique: 0, total: 0 });

  const fetchCards = () => {
    const ownedData = db.getAllSync(
      "SELECT card_id, quantity FROM collection WHERE card_id LIKE ?",
      [`${set_id}-%`],
    );

    const ownedMap = {};
    const basePlaysetMap = {}; // Tracks aggregate total of Base ID + Alt Arts

    ownedData.forEach((row) => {
      ownedMap[row.card_id] = row.quantity;

      // Extract Base ID (e.g., "OP01-002_p1" becomes "OP01-002")
      const baseId = row.card_id.split("_")[0];
      basePlaysetMap[baseId] = (basePlaysetMap[baseId] || 0) + row.quantity;
    });

    const masterData = db.getAllSync(
      "SELECT id, color, type, image_url FROM cards WHERE set_id = ? ORDER BY id ASC",
      [set_id],
    );

    const masterList = masterData.map((row) => {
      const baseId = row.id.split("_")[0];
      return {
        id: row.id,
        color: row.color,
        type: row.type,
        imageUrl: `https://en.onepiece-cardgame.com/images/cardlist/card/${row.id}.png`,
        owned: ownedMap[row.id] > 0,
        quantity: ownedMap[row.id] || 0,
        // The combined total of this card + any of its alt-arts you own!
        playsetTotal: basePlaysetMap[baseId] || 0,
      };
    });

    // Update Set Statistics
    setSetStats({
      unique: masterList.filter((c) => c.owned).length,
      total: masterList.length,
    });

    if (showMissing) setCardsToDisplay(masterList);
    else setCardsToDisplay(masterList.filter((card) => card.owned));
  };

  useEffect(() => {
    fetchCards();
  }, [set_id, showMissing]);

  // --- DATABASE LOGIC FOR PLUS / MINUS ---
  const handleIncrement = () => {
    if (!selectedCard) return;
    const cardId = selectedCard.id;
    const existing = db.getFirstSync(
      "SELECT quantity FROM collection WHERE card_id = ?",
      [cardId],
    );

    if (existing)
      db.runSync(
        "UPDATE collection SET quantity = quantity + 1 WHERE card_id = ?",
        [cardId],
      );
    else
      db.runSync("INSERT INTO collection (card_id, quantity) VALUES (?, 1)", [
        cardId,
      ]);

    fetchCards();
    setSelectedCard((prev) => ({
      ...prev,
      quantity: prev.quantity + 1,
      owned: true,
    }));
  };

  const handleDecrement = () => {
    if (!selectedCard || selectedCard.quantity === 0) return;
    const cardId = selectedCard.id;
    const existing = db.getFirstSync(
      "SELECT quantity FROM collection WHERE card_id = ?",
      [cardId],
    );

    if (existing) {
      if (existing.quantity > 1)
        db.runSync(
          "UPDATE collection SET quantity = quantity - 1 WHERE card_id = ?",
          [cardId],
        );
      else db.runSync("DELETE FROM collection WHERE card_id = ?", [cardId]);

      fetchCards();
      const newQty = selectedCard.quantity - 1;
      setSelectedCard((prev) => ({
        ...prev,
        quantity: newQty,
        owned: newQty > 0,
      }));
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Set Header */}
      <View style={styles.headerBox}>
        <Text style={styles.title}>{set_id} Collection</Text>
        <Text style={styles.statsText}>
          {setStats.unique} / {setStats.total} Unique Variants Collected
        </Text>
      </View>

      <FlatList
        data={cardsToDisplay}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isLeader = item.type && item.type.toLowerCase() === "leader";
          // A Leader is complete at 1 copy. Everything else needs 4.
          const isComplete = isLeader
            ? item.quantity >= 1
            : item.playsetTotal >= 4;

          return (
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
                  <Text
                    style={[
                      styles.qtyText,
                      { color: isComplete ? "#4ade80" : "#eab308" }, // Apply the smart logic
                    ]}
                  >
                    x{item.quantity}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No cards owned in this set.</Text>
        }
      />

      {/* THE POPUP MODAL */}
      <Modal visible={!!selectedCard} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelectedCard(null)}
          />
          {selectedCard && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedCard.imageUrl }}
                style={styles.modalLargeImage}
                resizeMode="contain"
              />
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
  headerBox: { marginBottom: 15, alignItems: "center" },
  title: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  statsText: { color: "#888", fontSize: 14, marginTop: 5 },

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
    backgroundColor: "rgba(0,0,0,0.85)",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyText: { fontSize: 13, fontWeight: "bold" },
  empty: { color: "#888", textAlign: "center", marginTop: 50 },

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
