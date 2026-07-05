import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SettingsContext } from "../_layout";
import db from "../../database";
import { RARITY_MAP } from "../../constants/gameData";
import CardModal from "../../components/CardModal";
import FilterDrawer from "../../components/FilterDrawer";

export default function SetDetails() {
  const { set_id } = useLocalSearchParams();
  const { showMissing, setShowMissing } = useContext(SettingsContext);

  const [masterCards, setMasterCards] = useState([]);
  const [setStats, setSetStats] = useState({ unique: 0, total: 0 });
  const [selectedCard, setSelectedCard] = useState(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [filterColors, setFilterColors] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterRarities, setFilterRarities] = useState([]);

  const fetchCards = () => {
    const ownedData = db.getAllSync(
      "SELECT card_id, quantity FROM collection WHERE card_id LIKE ?",
      [`${set_id}-%`],
    );
    const ownedMap = {};
    const basePlaysetMap = {};

    ownedData.forEach((row) => {
      ownedMap[row.card_id] = row.quantity;
      const baseId = row.card_id.split("_")[0];
      basePlaysetMap[baseId] = (basePlaysetMap[baseId] || 0) + row.quantity;
    });

    const masterData = db.getAllSync(
      "SELECT id, name, color, type, cost, rarity, image_url FROM cards WHERE set_id = ? ORDER BY id ASC",
      [set_id],
    );

    const masterList = masterData.map((row) => {
      const baseId = row.id.split("_")[0];
      return {
        id: row.id,
        name: row.name || "",
        color: row.color || "",
        type: row.type || "",
        rarity: row.rarity || "",
        cost: row.cost,
        imageUrl: `https://en.onepiece-cardgame.com/images/cardlist/card/${row.id}.png`,
        owned: ownedMap[row.id] > 0,
        quantity: ownedMap[row.id] || 0,
        playsetTotal: basePlaysetMap[baseId] || 0,
      };
    });

    setSetStats({
      unique: masterList.filter((c) => c.owned).length,
      total: masterList.length,
    });
    setMasterCards(masterList);
  };

  useEffect(() => {
    fetchCards();
  }, [set_id]);

  const displayCards = masterCards.filter((card) => {
    if (!showMissing && !card.owned) return false;
    if (
      searchName &&
      !card.name.toLowerCase().includes(searchName.toLowerCase())
    )
      return false;
    if (
      filterColors.length > 0 &&
      !filterColors.some((c) => card.color.includes(c))
    )
      return false;
    if (filterTypes.length > 0 && !filterTypes.includes(card.type))
      return false;

    if (filterRarities.length > 0) {
      const matchesRarity = filterRarities.some((shortRarity) => {
        const fullRarity = RARITY_MAP[shortRarity];
        return (
          card.rarity &&
          card.rarity.toLowerCase().includes(fullRarity.toLowerCase())
        );
      });
      if (!matchesRarity) return false;
    }
    return true;
  });

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
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              style={{ paddingRight: 10 }}
            >
              <Ionicons name="filter" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.headerBox}>
        <Text style={styles.title}>{set_id} Collection</Text>
        <Text style={styles.statsText}>
          {setStats.unique} / {setStats.total} Unique Variants Collected
        </Text>
      </View>

      <FlatList
        data={displayCards}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => {
          const isLeader = item.type && item.type.toLowerCase() === "leader";
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
                      { color: isComplete ? "#4ade80" : "#eab308" },
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
          <Text style={styles.empty}>
            No cards found matching these filters.
          </Text>
        }
      />

      {/* ⭐️ Using our new components! */}
      <FilterDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        showMissing={showMissing}
        setShowMissing={setShowMissing}
        searchName={searchName}
        setSearchName={setSearchName}
        filterColors={filterColors}
        setFilterColors={setFilterColors}
        filterTypes={filterTypes}
        setFilterTypes={setFilterTypes}
        filterRarities={filterRarities}
        setFilterRarities={setFilterRarities}
      />

      <CardModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
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
});
