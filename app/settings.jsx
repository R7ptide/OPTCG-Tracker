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
import { colors, radius, spacing, typography } from "../constants/theme";

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
    } catch {
      Alert.alert("Import Failed", "The file is corrupt or invalid.");
    }
  };

  const processImport = (data) => {
    try {
      db.withTransactionSync(() => {
        db.runSync("DELETE FROM collection");
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
    } catch {
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
          color={colors.accent}
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Export Collection (Backup)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonAction} onPress={handleImport}>
        <Ionicons
          name="cloud-download-outline"
          size={20}
          color={colors.accent}
          style={styles.icon}
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
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Ionicons
              name="sync-outline"
              size={20}
              color={colors.text}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Sync Latest Master List</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
  header: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  buttonAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 18,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  buttonSync: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 18,
    borderRadius: radius.sm,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: "bold",
  },
  icon: { marginRight: spacing.sm },
});
