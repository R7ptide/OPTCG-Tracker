import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSync } from "../hooks/useSync";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import db from "../database";

export default function Settings() {
  const { syncMasterList } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncMasterList();
    setIsSyncing(false);
    if (success) Alert.alert("Success", "Master List updated!");
    else Alert.alert("Error", "Failed to sync. Check connection.");
  };

  const handleExport = async () => {
    try {
      const collection = db.getAllSync("SELECT * FROM collection");
      if (collection.length === 0)
        return Alert.alert("Empty", "No cards to export!");

      const file = new File(Paths.document, "OP_Vault_Backup.json");
      file.create({ overwrite: true });
      file.write(JSON.stringify(collection));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      }
    } catch (error) {
      Alert.alert("Export Failed", error.message);
    }
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      if (result.canceled) return;

      const picked = new File(result.assets[0].uri);
      const fileContent = await picked.text();
      const importedData = JSON.parse(fileContent);

      if (!Array.isArray(importedData))
        throw new Error("Invalid backup file format.");

      Alert.alert(
        "Warning",
        "This will OVERWRITE your current collection. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            style: "destructive",
            onPress: () => processImport(importedData),
          },
        ],
      );
    } catch (error) {
      Alert.alert("Import Failed", "The file is corrupt or invalid.");
    }
  };

  const processImport = (data) => {
    try {
      db.withTransactionSync(() => {
        db.runSync("DELETE FROM collection"); // Wipe existing
        const insertStmt = db.prepareSync(
          "INSERT INTO collection (card_id, quantity) VALUES (?, ?)",
        );
        data.forEach((item) => {
          if (item.card_id && item.quantity) {
            insertStmt.executeSync([item.card_id, item.quantity]);
          }
        });
      });
      Alert.alert("Success", "Collection restored successfully!");
    } catch (error) {
      Alert.alert("Database Error", "Failed to write imported data.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Data Management</Text>

      <Text style={styles.description}>
        Backup your physical collection to the cloud, or restore from a previous
        save.
      </Text>

      <TouchableOpacity style={styles.buttonAction} onPress={handleExport}>
        <Ionicons
          name="cloud-upload-outline"
          size={20}
          color="#4ade80"
          style={{ marginRight: 10 }}
        />
        <Text style={styles.buttonText}>Export Collection (Backup)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonAction} onPress={handleImport}>
        <Ionicons
          name="cloud-download-outline"
          size={20}
          color="#4ade80"
          style={{ marginRight: 10 }}
        />
        <Text style={styles.buttonText}>Import Collection (Restore)</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.description}>
        Pull the latest card dictionary from punk-records. You only need to do
        this when a new set drops.
      </Text>

      <TouchableOpacity
        style={styles.buttonSync}
        onPress={handleSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons
              name="sync-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 10 }}
            />
            <Text style={styles.buttonText}>Sync Latest Master List</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  header: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 10,
  },
  description: { color: "#888", fontSize: 14, marginBottom: 15 },
  divider: { height: 1, backgroundColor: "#333", marginVertical: 30 },
  buttonAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 18,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#4ade80",
  },
  buttonSync: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6b21a8",
    padding: 18,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
