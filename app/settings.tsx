import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useMemo } from "react";
import {
  getAllCollectionRows,
  restoreCollection,
  wipeCollection,
  type BackupRow,
} from "../repositories/collection";
import { useSettings } from "./_layout";
import { radius, spacing, typography, type ThemeColors } from "../constants/theme";

export default function Settings() {
  const { showMissing, setShowMissing, isLightMode, toggleLightMode, colors } =
    useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleExport = async () => {
    try {
      const collection = getAllCollectionRows();
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
      restoreCollection(data);
      Alert.alert("Success", "Collection restored successfully!");
    } catch {
      Alert.alert("Database Error", "Failed to write imported data.");
    }
  };

  const handleWipeCollection = () => {
    Alert.alert(
      "Wipe Entire Collection?",
      "This action is permanent and cannot be undone. All your collected cards will be erased.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            try {
              wipeCollection();
              Alert.alert(
                "Wiped",
                "Your collection has been permanently deleted.",
              );
            } catch {
              Alert.alert("Error", "Failed to delete collection.");
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.header}>Profile</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Light Mode</Text>
        <Switch
          value={isLightMode}
          onValueChange={toggleLightMode}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Show Missing Cards</Text>
        <Switch
          value={showMissing}
          onValueChange={setShowMissing}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      <View style={styles.divider} />

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

      <Text style={styles.dangerHeader}>Danger Zone</Text>
      <Text style={styles.description}>
        Permanently erase all your collected cards from this device.
      </Text>

      <TouchableOpacity
        style={styles.buttonDanger}
        onPress={handleWipeCollection}
      >
        <Ionicons
          name="trash-outline"
          size={20}
          color={colors.danger}
          style={styles.icon}
        />
        <Text style={styles.buttonTextDanger}>Wipe Collection</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  toggleLabel: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xl,
  },
  description: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    marginBottom: spacing.md,
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
  dangerHeader: {
    color: colors.danger,
    fontSize: typography.sizes.lg,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  buttonDanger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerBg,
    padding: 18,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  buttonTextDanger: {
    color: colors.danger,
    fontSize: typography.sizes.lg,
    fontWeight: "bold",
  },
});
