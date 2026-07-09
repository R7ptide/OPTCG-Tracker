import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import db, { type CollectionRow } from "../database";
import { colors, radius, spacing, typography } from "../constants/theme";

type BackupRow = {
  card_id: string;
  quantity: number;
};

export default function Settings() {
  const handleExport = async () => {
    try {
      const collection = db.getAllSync<CollectionRow>(
        "SELECT * FROM collection",
      );
      if (collection.length === 0)
        return Alert.alert("Empty", "No cards to export!");

      const file = new File(Paths.document, "OP_Vault_Backup.json");
      file.create({ overwrite: true });
      file.write(JSON.stringify(collection));

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Export Failed", message);
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
            onPress: () => processImport(importedData as BackupRow[]),
          },
        ],
      );
    } catch {
      Alert.alert("Import Failed", "The file is corrupt or invalid.");
    }
  };

  const processImport = (data: BackupRow[]) => {
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
  buttonText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: "bold",
  },
  icon: { marginRight: spacing.sm },
});
