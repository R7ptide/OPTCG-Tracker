import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

// Generate arrays for OP01-OP16 and EB01-EB04
const mainSets = Array.from(
  { length: 16 },
  (_, i) => `OP${String(i + 1).padStart(2, "0")}`,
);
const extraBoosters = Array.from(
  { length: 4 },
  (_, i) => `EB${String(i + 1).padStart(2, "0")}`,
);

export default function CollectionMenu() {
  const navigateToSet = (setId) => router.push(`/collection/${setId}`);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Special</Text>
      <TouchableOpacity
        style={styles.setCard}
        onPress={() => router.push("/collection/starters")}
      >
        <Text style={styles.setText}>Starter Decks (ST)</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Main Expansions</Text>
      <View style={styles.grid}>
        {mainSets.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCardHalf}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.header}>Extra Boosters</Text>
      <View style={styles.grid}>
        {extraBoosters.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCardHalf}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 15 },
  header: {
    color: "#888",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  setCard: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  setCardHalf: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 8,
    width: "48%",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  setText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
