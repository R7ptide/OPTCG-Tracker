import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const mainSets = Array.from(
  { length: 16 },
  (_, i) => `OP${String(i + 1).padStart(2, "0")}`,
);
const extraBoosters = Array.from(
  { length: 4 },
  (_, i) => `EB${String(i + 1).padStart(2, "0")}`,
);
const premiumBoosters = ["PRB01", "PRB02"];

export default function CollectionMenu() {
  const navigateToSet = (setId) => router.push(`/collection/${setId}`);

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/settings")}
              style={{ paddingRight: 10 }}
            >
              {/* 2. Replace the Text emoji with the Icon */}
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* 1. SPECIAL & PROMOS */}
      <Text style={styles.header}>Special & Promos</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.setCardHalf}
          onPress={() => router.push("/collection/starters")}
        >
          <Text style={styles.setText}>Starter Decks (ST)</Text>
        </TouchableOpacity>

        {/* The new Promo route! */}
        <TouchableOpacity
          style={styles.setCardHalf}
          onPress={() => navigateToSet("P")}
        >
          <Text style={styles.setText}>Promos (P)</Text>
        </TouchableOpacity>

        {/* PRBs moved to the Special section */}
        {premiumBoosters.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCardHalf}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2. MAIN EXPANSIONS */}
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

      {/* 3. EXTRA BOOSTERS */}
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
