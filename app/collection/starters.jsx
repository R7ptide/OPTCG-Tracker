import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";

// Programmatically generate ST01 through ST30
const starterDecks = Array.from(
  { length: 30 },
  (_, i) => `ST${String(i + 1).padStart(2, "0")}`,
);

export default function StartersMenu() {
  const navigateToSet = (setId) => router.push(`/collection/${setId}`);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Starter Decks</Text>

      <View style={styles.grid}>
        {starterDecks.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCard}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom padding so the scroll doesn't get cut off by the screen edge */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 15,
  },
  header: {
    color: "#888",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  // We use 3 columns here since "ST01" is a short string,
  // keeping the list of 30 decks nicely compact!
  setCard: {
    backgroundColor: "#1e1e1e",
    paddingVertical: 15,
    borderRadius: 8,
    width: "31%",
    alignItems: "center",
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#333",
  },
  setText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
