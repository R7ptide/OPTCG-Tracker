import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { router, Stack, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useCallback, useMemo } from "react";
import { useSync } from "../hooks/useSync";
import {
  getCollectionStats,
  type CollectionStats,
} from "../repositories/collection";
import { getTotalCardCount } from "../repositories/cards";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../constants/theme";
import { useSettings } from "./_layout";

type Stats = CollectionStats;

const readStats = (): Stats => {
  try {
    return getCollectionStats();
  } catch {
    return { unique: 0, total: 0 };
  }
};

const readHasCards = (): boolean => {
  try {
    return getTotalCardCount() > 0;
  } catch {
    return false;
  }
};

export default function Home() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { syncMasterList } = useSync();
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<Stats>(readStats);
  const [hasCards, setHasCards] = useState(readHasCards);

  useFocusEffect(
    useCallback(() => {
      setStats(readStats());
      setHasCards(readHasCards());
    }, []),
  );

  const handleSync = async () => {
    setIsSyncing(true);
    const success = await syncMasterList();
    setIsSyncing(false);
    if (success) {
      setHasCards(readHasCards());
      Alert.alert("Success", "Master List updated!");
    } else {
      Alert.alert("Error", "Failed to sync. Check connection.");
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "R7-Pose",
          headerTitleAlign: "center",
          headerLeft: () => (
            <Image
              source={require("../assets/images/icon.png")}
              style={{
                width: 28,
                height: 28,
                marginLeft: spacing.xs,
                borderRadius: 6,
              }}
            />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSync}
              disabled={isSyncing}
              style={{ paddingRight: spacing.sm }}
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

      {hasCards ? (
        <>
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
            <Ionicons name="layers-outline" size={36} color="#fff" />
            <Text
              style={[styles.mainButtonText, styles.mainButtonTextOnPrimary]}
            >
              My Collection
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons
            name="cloud-download-outline"
            size={40}
            color={colors.accent}
          />
          <Text style={styles.emptyTitle}>Welcome to R7-Pose</Text>
          <Text style={styles.emptyText}>
            No card data yet. Sync the master list to start tracking your
            collection.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.emptyButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/*<TouchableOpacity
        style={[styles.mainButton, { backgroundColor: colors.surfaceAlt }]}
        onPress={() => router.push("/tournaments")}
      >
        <Ionicons name="trophy-outline" size={36} color={colors.text} />
        <Text style={styles.mainButtonText}>My Tournaments</Text>
      </TouchableOpacity>*/}

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => router.push("/tournaments")}
        >
          <Ionicons name="trophy-outline" size={28} color={colors.text} />
          <Text style={styles.smallButtonText}>My Tournaments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => router.push("/tournaments/stats")}
        >
          <Ionicons name="stats-chart-outline" size={28} color={colors.text} />
          <Text style={styles.smallButtonText}>Tournaments Stats</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        {/*<TouchableOpacity
          style={styles.smallButton}
          onPress={() => router.push("/decks")}
        >
          <Ionicons name="albums-outline" size={28} color={colors.text} />
          <Text style={styles.smallButtonText}>Decks</Text>
        </TouchableOpacity> */}

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      gap: spacing.sm,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    emptyButton: {
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
    },
    emptyButtonText: {
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
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
    mainButtonTextOnPrimary: {
      color: "#fff",
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
