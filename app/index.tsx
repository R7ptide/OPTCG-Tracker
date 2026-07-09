import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useSync } from "../hooks/useSync";
import { colors, radius, spacing, typography } from "../constants/theme";

export default function Home() {
  const { syncMasterList } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncMasterList();
    setIsSyncing(false);
    if (success) Alert.alert("Success", "Master List updated!");
    else Alert.alert("Error", "Failed to sync. Check connection.");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "R7-Pose",
          headerTitleAlign: "center",
          headerLeft: () => (
            <Ionicons
              name="skull"
              size={24}
              color={colors.text}
              style={{ marginLeft: 5 }}
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSync}
              disabled={isSyncing}
              style={{ paddingRight: 10 }}
            >
              {isSyncing ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <Ionicons name="sync-outline" size={24} color={colors.text} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.push("/collection")}
      >
        <Text style={styles.mainButtonText}>My Collection</Text>
      </TouchableOpacity>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => router.push("/decks")}
        >
          <Ionicons name="albums-outline" size={28} color={colors.text} />
          <Text style={styles.smallButtonText}>Decks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => router.push("/stats")}
        >
          <Ionicons name="bar-chart-outline" size={28} color={colors.text} />
          <Text style={styles.smallButtonText}>Stats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.smallButton}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={28} color={colors.text} />
          <Text style={styles.smallButtonText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    padding: spacing.lg,
  },
  mainButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.xxl,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  mainButtonText: {
    color: colors.text,
    fontSize: typography.sizes.display,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  smallButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallButtonText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
    marginTop: spacing.xs,
  },
});
