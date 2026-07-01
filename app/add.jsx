import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from "react-native";
import { useVault } from "../hooks/useVault"; // This is the hook we built earlier!

export default function AddCards() {
  const { collection, addCard } = useVault();
  const [cardId, setCardId] = useState("");
  const [quantity, setQuantity] = useState("1");

  const handleAdd = () => {
    // Only attempt to add if there's text
    if (!cardId.trim()) return;

    // Ensure the format matches the DB (e.g., ST01-001)
    const formattedId = cardId.trim().toUpperCase();

    const success = addCard(formattedId, quantity);
    if (success) {
      setCardId("");
      setQuantity("1");
    } else {
      alert("Failed to add card. Check the ID.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Add to Vault</Text>

      {/* Input Section */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Card ID (e.g., ST01-001)"
          placeholderTextColor="#888"
          value={cardId}
          onChangeText={setCardId}
          autoCapitalize="characters"
        />
        <TextInput
          style={[styles.input, styles.qtyInput]}
          placeholder="Qty"
          placeholderTextColor="#888"
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleAdd}>
          <Text style={styles.buttonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Show Recently Added Cards */}
      <Text style={styles.recentHeader}>Recent Additions</Text>
      <FlatList
        // We reverse the collection so the newest stuff shows up on top
        data={[...collection].reverse()}
        keyExtractor={(item) => item.card_id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.cardRow}>
            <Text style={styles.cardText}>{item.card_id}</Text>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>x{item.quantity}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Start scanning your cards!</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginVertical: 20,
  },
  recentHeader: {
    color: "#888",
    marginLeft: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  form: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    color: "#fff",
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  qtyInput: { flex: 0.3, textAlign: "center" },
  button: {
    backgroundColor: "#6b21a8",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  listContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  qtyBadge: {
    backgroundColor: "#333",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  qtyText: { color: "#4ade80", fontWeight: "bold", fontSize: 14 },
  emptyText: { color: "#555", textAlign: "center", marginTop: 20 },
});
