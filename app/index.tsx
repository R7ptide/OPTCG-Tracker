import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback } from "react";
import { useSync } from "../hooks/useSync";
import db from "../database";
import { colors, radius, spacing, typography } from "../constants/theme";

type Stats = { unique: number; total: number };

const readStats = (): Stats => {
  try {
    const uniqueRow = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM collection",
    );
    const totalRow = db.getFirstSync<{ sum: number | null }>(
      "SELECT SUM(quantity) as sum FROM collection",
    );
    return {
      unique: uniqueRow?.count ?? 0,
      total: totalRow?.sum ?? 0,
    };
  } catch {
    return { unique: 0, total: 0 };
  }
};

export default function Home() {
  const { syncMasterList } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<Stats>(readStats);

  useFocusEffect(
    useCallback(() => {
      setStats(readStats());
    }, []),
  );

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

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Collection Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.unique}</Text>
            <Text style={styles.statLabel}>Unique Cards</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.mainButton}
        onPress={() => router.push("/collection")}
      >
        <Ionicons name="layers-outline" size={36} color={colors.text} />
        <Text style={styles.mainButtonText}>My Collection</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.mainButton, { backgroundColor: colors.surfaceAlt }]}
        onPress={() => router.push("/tournaments")}
      >
        <Ionicons name="trophy-outline" size={36} color={colors.text} />
        <Text style={styles.mainButtonText}>My Tournaments</Text>
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
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsTitle: {
    color: colors.text,
    fontSize: typography.sizes.xl,
    fontWeight: "bold",
    marginBottom: spacing.md,
    textAlign: "center",
  },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  statBox: { alignItems: "center" },
  statNumber: {
    color: colors.accent,
    fontSize: typography.sizes.display,
    fontWeight: "bold",
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  mainButton: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.xl,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  mainButtonText: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  smallButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallButtonText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: "bold",
    marginTop: spacing.xs,
  },
});
