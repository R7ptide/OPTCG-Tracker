import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { SettingsContext } from "../_layout";
import db from "../../database";

export default function SetDetails() {
  const { set_id } = useLocalSearchParams();
  const { showMissing, setShowMissing } = useContext(SettingsContext);

  const [masterCards, setMasterCards] = useState([]);
  const [setStats, setSetStats] = useState({ unique: 0, total: 0 });
  const [selectedCard, setSelectedCard] = useState(null);

  // --- NEW: Multi-Select Filter States (Arrays instead of Strings) ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [filterColors, setFilterColors] = useState([]);
  const [filterTypes, setFilterTypes] = useState([]);
  const [filterRarities, setFilterRarities] = useState([]);

  // Helper to add/remove a filter from its array when tapped
  const toggleFilter = (setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

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

    // Added "rarity" to the database pull
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
        rarity: row.rarity || "", // Save rarity to the card object
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

  const RARITY_MAP = {
    C: "Common",
    UC: "Uncommon",
    R: "Rare",
    SR: "SuperRare",
    SEC: "SecretRare",
    L: "Leader",
    SP: "Special",
    TR: "TreasureRare",
  };

  // --- SMART MULTI-FILTER LOGIC ---
  const displayCards = masterCards.filter((card) => {
    if (!showMissing && !card.owned) return false;
    if (
      searchName &&
      !card.name.toLowerCase().includes(searchName.toLowerCase())
    )
      return false;

    // Check Color
    if (
      filterColors.length > 0 &&
      !filterColors.some((c) => card.color.includes(c))
    )
      return false;

    // Check Type
    if (filterTypes.length > 0 && !filterTypes.includes(card.type))
      return false;

    // Check Rarity (Translated)
    if (filterRarities.length > 0) {
      const matchesRarity = filterRarities.some((shortRarity) => {
        const fullRarity = RARITY_MAP[shortRarity];
        // Safely check if the punk-records rarity string includes our mapped word
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
              <Text style={{ fontSize: 26, color: "#fff" }}>☰</Text>
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

      {/* --- FILTER DRAWER MODAL --- */}
      <Modal visible={isMenuOpen} transparent={true} animationType="fade">
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerCloseArea}
            onPress={() => setIsMenuOpen(false)}
          />

          <View style={styles.drawerContent}>
            <Text style={styles.drawerTitle}>Filters</Text>

            <TouchableOpacity
              style={[
                styles.filterButton,
                showMissing ? styles.filterActive : {},
              ]}
              onPress={() => setShowMissing(!showMissing)}
            >
              <Text style={styles.filterButtonText}>
                {showMissing ? "Missing: SHOWN" : "Missing: HIDDEN"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.filterLabel}>Card Name</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. Zoro"
              placeholderTextColor="#666"
              value={searchName}
              onChangeText={setSearchName}
            />

            {/* COLOR CHIPS */}
            <Text style={styles.filterLabel}>Color</Text>
            <View style={styles.filterRow}>
              {["Red", "Green", "Blue"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    filterColors.includes(c) && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter(setFilterColors, c)}
                >
                  <Text style={styles.chipText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterRow}>
              {["Purple", "Black", "Yellow"].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.chip,
                    filterColors.includes(c) && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter(setFilterColors, c)}
                >
                  <Text style={styles.chipText}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TYPE CHIPS */}
            <Text style={styles.filterLabel}>Card Type</Text>
            <View style={styles.filterRow}>
              {["Leader", "Character"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    filterTypes.includes(t) && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter(setFilterTypes, t)}
                >
                  <Text style={styles.chipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterRow}>
              {["Event", "Stage"].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.chip,
                    filterTypes.includes(t) && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter(setFilterTypes, t)}
                >
                  <Text style={styles.chipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* RARITY CHIPS */}
            <Text style={styles.filterLabel}>Rarity</Text>
            <View style={styles.filterRow}>
              {["C", "UC", "R", "SR"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.chip,
                    filterRarities.includes(r) && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter(setFilterRarities, r)}
                >
                  <Text style={styles.chipText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterRow}>
              {["SEC", "L", "SP", "TR"].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.chip,
                    filterRarities.includes(r) && styles.chipActive,
                  ]}
                  onPress={() => toggleFilter(setFilterRarities, r)}
                >
                  <Text style={styles.chipText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeDrawerButton}
              onPress={() => setIsMenuOpen(false)}
            >
              <Text style={styles.closeDrawerText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- CARD DETAILS MODAL (Plus/Minus) --- */}
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

  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  drawerCloseArea: { flex: 1 },
  drawerContent: {
    width: "80%",
    backgroundColor: "#1a1a1a",
    padding: 20,
    paddingTop: 60,
    borderLeftWidth: 1,
    borderColor: "#333",
  },
  drawerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  divider: { height: 1, backgroundColor: "#333", marginVertical: 20 },
  filterLabel: {
    color: "#888",
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  filterRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  chip: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#6b21a8", borderColor: "#d8b4fe" },
  chipText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  filterButton: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  filterActive: { borderColor: "#4ade80" },
  filterButtonText: { color: "#fff", fontWeight: "bold" },
  closeDrawerButton: {
    backgroundColor: "#4ade80",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 30,
  },
  closeDrawerText: { color: "#000", fontWeight: "bold", fontSize: 16 },
});
