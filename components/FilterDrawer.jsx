import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
} from "react-native";

export default function FilterDrawer({
  isOpen,
  onClose,
  showMissing,
  setShowMissing,
  searchName,
  setSearchName,
  filterColors,
  setFilterColors,
  filterTypes,
  setFilterTypes,
  filterRarities,
  setFilterRarities,
}) {
  // Moved this helper inside the component where it belongs!
  const toggleFilter = (setState, value) => {
    setState((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  return (
    <Modal visible={isOpen} transparent={true} animationType="fade">
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.drawerCloseArea} onPress={onClose} />
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

          <TouchableOpacity style={styles.closeDrawerButton} onPress={onClose}>
            <Text style={styles.closeDrawerText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
