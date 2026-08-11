import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Stack, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { useMemo } from "react";
import { wipeCollection } from "../../repositories/collection";
import {
  buildBackupPayload,
  restoreBackupPayload,
  isLegacyCollectionBackup,
  isBackupPayload,
  type BackupPayload,
} from "../../repositories/backup";
import { useSettings } from "../../contexts/SettingsContext";
import { useCloudBackup } from "../../hooks/useCloudBackup";
import { formatDateDisplay, toDateString } from "../../utils/date";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";

export default function Settings() {
  const { showMissing, setShowMissing, isLightMode, toggleLightMode, colors } =
    useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    isLinked,
    linkedEmail,
    hasCloudBackup,
    lastBackupAt,
    isBusy,
    linkGoogleAccount,
    unlinkGoogleAccount,
    backupNow,
    restoreFromCloud,
  } = useCloudBackup();

  const handleLinkGoogle = async () => {
    try {
      await linkGoogleAccount();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Link Failed", message);
    }
  };

  const handleUnlink = () => {
    Alert.alert("Unlink Google Account?", "You can link it again anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: () => unlinkGoogleAccount(),
      },
    ]);
  };

  const handleBackupNow = async () => {
    try {
      await backupNow();
      Alert.alert("Backed Up", "Your data has been saved to Google Drive.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Backup Failed", message);
    }
  };

  const handleRestoreFromCloud = () => {
    Alert.alert(
      "Restore from Cloud?",
      "Restoring will completely overwrite any cards and tournaments currently on this device. Are you sure you want to proceed?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "destructive",
          onPress: async () => {
            try {
              await restoreFromCloud();
              Alert.alert("Restored", "Your data has been restored from Google Drive.");
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "Unknown error";
              Alert.alert("Restore Failed", message);
            }
          },
        },
      ],
    );
  };

  const handleExport = async () => {
    try {
      const payload = buildBackupPayload();
      if (payload.collection.length === 0 && payload.tournaments.length === 0)
        return Alert.alert("Empty", "Nothing to export yet!");

      const file = new File(Paths.document, "OP_Vault_Backup.json");
      file.create({ overwrite: true });
      file.write(JSON.stringify(payload));

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

      let payload: BackupPayload;
      if (isLegacyCollectionBackup(importedData)) {
        payload = {
          version: 1,
          exportedAt: "",
          collection: importedData,
          tournaments: [],
          matches: [],
        };
      } else if (isBackupPayload(importedData)) {
        payload = importedData;
      } else {
        throw new Error("Invalid backup file format.");
      }

      Alert.alert(
        "Warning",
        "This will OVERWRITE your current collection and tournaments. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Import",
            style: "destructive",
            onPress: () => processImport(payload),
          },
        ],
      );
    } catch {
      Alert.alert("Import Failed", "The file is corrupt or invalid.");
    }
  };

  const processImport = (payload: BackupPayload) => {
    try {
      restoreBackupPayload(payload);
      Alert.alert("Success", "Your data has been restored successfully!");
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
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/settings/whats-new")}
              style={{ marginRight: spacing.md }}
            >
              <Ionicons
                name="sparkles-outline"
                size={24}
                color={colors.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

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

        <Text style={styles.sectionLabel}>Cloud Backup (Recommended)</Text>

        {isLinked ? (
          <>
            <View style={styles.linkedRow}>
              <Text style={styles.linkedText} numberOfLines={1}>
                Linked as {linkedEmail}
              </Text>
              <TouchableOpacity onPress={handleUnlink}>
                <Text style={styles.unlinkText}>Unlink</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>
              {lastBackupAt
                ? `Last backed up: ${formatDateDisplay(toDateString(new Date(lastBackupAt)))}`
                : "No cloud backup yet"}
            </Text>

            <TouchableOpacity
              style={styles.buttonAction}
              onPress={handleBackupNow}
              disabled={isBusy}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color={colors.accent}
                style={styles.icon}
              />
              <Text style={styles.buttonText}>
                {isBusy ? "Backing up…" : "Backup Now"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.buttonAction,
                !hasCloudBackup && styles.buttonActionDisabled,
              ]}
              onPress={handleRestoreFromCloud}
              disabled={isBusy || !hasCloudBackup}
            >
              <Ionicons
                name="cloud-download-outline"
                size={20}
                color={hasCloudBackup ? colors.accent : colors.textMuted}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.buttonText,
                  !hasCloudBackup && styles.buttonTextDisabled,
                ]}
              >
                {isBusy ? "Restoring…" : "Restore from Cloud"}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.buttonAction}
            onPress={handleLinkGoogle}
          >
            <Ionicons
              name="logo-google"
              size={20}
              color={colors.accent}
              style={styles.icon}
            />
            <Text style={styles.buttonText}>Link Google Account</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>Advanced Data Options</Text>

        <Text style={styles.description}>
          Export your collection and tournament history to a JSON file, or
          restore from a previous save. Works without a Google account.
        </Text>

        <TouchableOpacity style={styles.buttonAction} onPress={handleExport}>
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color={colors.accent}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Export to JSON (Backup)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.buttonAction} onPress={handleImport}>
          <Ionicons
            name="cloud-download-outline"
            size={20}
            color={colors.accent}
            style={styles.icon}
          />
          <Text style={styles.buttonText}>Import from JSON (Restore)</Text>
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
    </>
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
    sectionLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    description: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      marginBottom: spacing.md,
    },
    linkedRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    linkedText: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
      flex: 1,
      marginRight: spacing.sm,
    },
    unlinkText: {
      color: colors.danger,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
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
    buttonActionDisabled: {
      borderColor: colors.border,
      opacity: 0.5,
    },
    buttonText: {
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    buttonTextDisabled: {
      color: colors.textMuted,
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
