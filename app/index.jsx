import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useSync } from "../hooks/useSync";
import { useState } from "react";

export default function Home() {
  const { syncMasterList } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncMasterList();
    setIsSyncing(false);
    if (success) alert("Master List synced successfully!");
    else alert("Failed to sync. Check your connection.");
  };

  return (
    <View style={styles.container}>
      {/* 1. The Collection Tracker (Now our main button) */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => router.push("/collection")}
      >
        <Text style={styles.buttonText}>My Collection</Text>
      </TouchableOpacity>

      {/* 2. Database Sync */}
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
