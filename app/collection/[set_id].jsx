import { View, Text, StyleSheet, FlatList, Image } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "../_layout";
import db from "../../database"; // Adjust path if needed

const getColorHex = (colorString) => {
  if (!colorString) return "#6b21a8"; // Default purple
  if (colorString.includes("Red")) return "#ef4444";
  if (colorString.includes("Green")) return "#22c55e";
  if (colorString.includes("Blue")) return "#3b82f6";
  if (colorString.includes("Purple")) return "#a855f7";
  if (colorString.includes("Black")) return "#3f3f46";
  if (colorString.includes("Yellow")) return "#eab308";
  return "#6b21a8"; // Fallback
};

export default function SetDetails() {
  const { set_id } = useLocalSearchParams(); // Gets "OP01", "ST04", etc. from the URL
  const { showMissing } = useContext(SettingsContext);
  const [cardsToDisplay, setCardsToDisplay] = useState([]);

  useEffect(() => {
    // 1. Get all cards the user owns for this specific set
    const ownedData = db.getAllSync(
      `
      SELECT collection.card_id, collection.quantity 
      FROM collection 
      WHERE collection.card_id LIKE ?
    `,
      [`${set_id}-%`],
    );

    // Create a quick lookup map (e.g., {"OP01-001": 2, "OP01-004": 1})
    const ownedMap = {};
    ownedData.forEach((row) => {
      ownedMap[row.card_id] = row.quantity;
    });

    // 2. Query the actual Master List from your synced local database
    // Grab the ID, color, and image from SQLite
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

    // 3. Filter based on the top-bar toggle
    if (showMissing) {
      setCardsToDisplay(masterList); // Show everything
    } else {
      setCardsToDisplay(masterList.filter((card) => card.owned)); // Show only colored/owned
    }
  }, [set_id, showMissing]); // Re-run when toggle changes

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{set_id} Collection</Text>

      <FlatList
        data={cardsToDisplay}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.cardSlot}>
            {/* Display the actual card art */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={[
                  styles.cardImage,
                  item.owned ? styles.imageOwned : styles.imageMissing,
                ]}
                resizeMode="contain"
              />
            ) : (
              // Fallback if the image link is broken
              <View
                style={[
                  styles.fallbackBox,
                  item.owned
                    ? { backgroundColor: getColorHex(item.color) }
                    : styles.cardMissing,
                ]}
              >
                <Text style={styles.cardText}>{item.id.split("-")[1]}</Text>
              </View>
            )}

            {/* Show the quantity badge if you own it */}
            {item.owned && (
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>x{item.quantity}</Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No cards owned in this set.</Text>
        }
      />
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
  cardSlot: {
    flex: 1,
    margin: 5,
    aspectRatio: 0.7,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  // Image Styling
  cardImage: { width: "100%", height: "100%", borderRadius: 8 },
  imageOwned: { opacity: 1 }, // Full color!
  imageMissing: { opacity: 0.2 }, // Faded out ghost card

  // Fallback styling if image is missing
  fallbackBox: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#fff",
  },
  cardMissing: { backgroundColor: "#1e1e1e", borderColor: "#333" },
  cardText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

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
});
