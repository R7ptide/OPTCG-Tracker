import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import db from "../database";
import { colors, radius, spacing, typography } from "../constants/theme";

const readStats = () => {
  try {
    const unique = db.getFirstSync("SELECT COUNT(*) as count FROM collection").count;
    const total = db.getFirstSync("SELECT SUM(quantity) as sum FROM collection").sum || 0;
    return { unique, total };
  } catch {
    return { unique: 0, total: 0 };
  }
};

export default function Home() {
  const [stats, setStats] = useState(readStats);

  useFocusEffect(
    useCallback(() => {
      setStats(readStats());
    }, []),
  );

  return (
    <View style={styles.container}>
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
  statNumber: { color: colors.accent, fontSize: typography.sizes.display, fontWeight: "bold" },
  statLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
    marginTop: spacing.xs,
  },
  menuButton: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: "center",
  },
  buttonText: { color: colors.text, fontSize: typography.sizes.xxl, fontWeight: "bold" },
});
