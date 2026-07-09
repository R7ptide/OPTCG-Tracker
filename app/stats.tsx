import { View, Text, StyleSheet } from "react-native";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

export default function Stats() {
  const [stats, setStats] = useState<Stats>(readStats);

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
            <Text style={styles.statLabel}>Total Cards</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
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
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statBox: {
    alignItems: "center",
  },
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
});
