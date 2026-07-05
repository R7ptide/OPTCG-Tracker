import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useSync } from "../hooks/useSync";
import { useState, useCallback } from "react";
import db from "../database";

export default function Home() {
  const { syncMasterList } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState({ unique: 0, total: 0 });

  // useFocusEffect runs every time you navigate back to this screen!
  useFocusEffect(
    useCallback(() => {
      try {
        const uniqueCount = db.getFirstSync(
          "SELECT COUNT(*) as count FROM collection",
        ).count;
        const totalCount =
          db.getFirstSync("SELECT SUM(quantity) as sum FROM collection").sum ||
          0;
        setStats({ unique: uniqueCount, total: totalCount });
      } catch (error) {
        console.log("Database not fully initialized yet.");
      }
    }, []),
  );

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncMasterList();
    setIsSyncing(false);
    if (success) alert("Master List synced successfully!");
    else alert("Failed to sync. Check your connection.");
  };

  return (
    <View style={styles.container}>
      {/* Global Stats Dashboard */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Vault Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.unique}</Text>
            <Text style={styles.statLabel}>Unique Cards</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Physical Cards</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push("/collection")}
      >
        <Text style={styles.buttonText}>My Collection</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.syncButton}
        onPress={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.syncText}>Sync Latest Sets Data</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    padding: 20,
  },
  statsCard: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#333",
  },
  statsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statNumber: { color: "#4ade80", fontSize: 32, fontWeight: "bold" },
  statLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    marginTop: 5,
  },
  menuButton: {
    backgroundColor: "#6b21a8",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 24, fontWeight: "bold" },
  syncButton: {
    marginTop: 50,
    backgroundColor: "#333",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  syncText: { color: "#aaa", fontSize: 16 },
});
