import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { getCardCountForSet } from "../../repositories/cards";
import { getSetOwnedCount } from "../../repositories/collection";
import {
  MAIN_SETS,
  EXTRA_BOOSTERS,
  PREMIUM_BOOSTERS,
  STARTER_DECKS,
} from "../../constants/gameData";
import { colors, radius, spacing, typography } from "../../constants/theme";

type Tab = "main" | "special" | "sts";

const TABS: { key: Tab; label: string }[] = [
  { key: "main", label: "Main" },
  { key: "special", label: "Special" },
  { key: "sts", label: "STs" },
];

type SetBoxProps = {
  title: string;
  sets: readonly string[];
  onPress: (id: string) => void;
  stats: Record<string, number>;
};

function SetBox({ title, sets, onPress, stats }: SetBoxProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>{title}</Text>
      <View style={styles.grid}>
        {sets.map((set) => {
          const progress = stats[set] || 0;

          return (
            <TouchableOpacity
              key={set}
              style={styles.setCard}
              onPress={() => onPress(set)}
            >
              <View style={styles.progressTrack} />

              <View style={styles.progressBarContainer}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>

              <Text style={styles.setText}>{set}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function CollectionMenu() {
  const [activeTab, setActiveTab] = useState<Tab>("main");
  const [stats, setStats] = useState<Record<string, number>>({});

  const navigateToSet = (setId: string) => router.push(`/collection/${setId}`);

  useFocusEffect(
    useCallback(() => {
      const allSets = [
        ...MAIN_SETS,
        ...EXTRA_BOOSTERS,
        ...PREMIUM_BOOSTERS,
        "P",
        ...STARTER_DECKS,
      ];

      const newStats: Record<string, number> = {};

      try {
        allSets.forEach((setId) => {
          const total = getCardCountForSet(setId);
          const owned = getSetOwnedCount(setId);

          newStats[setId] = total > 0 ? (owned / total) * 100 : 0;
        });

        setStats(newStats);
      } catch (error) {
        console.log("Error loading set completion stats", error);
      }
    }, []),
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === key && styles.tabTextActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {activeTab === "main" && (
          <>
            <SetBox
              title="One Piece"
              sets={MAIN_SETS}
              onPress={navigateToSet}
              stats={stats}
            />
            <SetBox
              title="Extra Boosters"
              sets={EXTRA_BOOSTERS}
              onPress={navigateToSet}
              stats={stats}
            />
            <SetBox
              title="Premium Boosters"
              sets={PREMIUM_BOOSTERS}
              onPress={navigateToSet}
              stats={stats}
            />
          </>
        )}

        {activeTab === "special" && (
          <SetBox
            title="Promos"
            sets={["P"]}
            onPress={navigateToSet}
            stats={stats}
          />
        )}

        {activeTab === "sts" && (
          <SetBox
            title="Starter Decks"
            sets={STARTER_DECKS}
            onPress={navigateToSet}
            stats={stats}
          />
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
  },
  tabTextActive: {
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  box: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  boxTitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  setCard: {
    backgroundColor: colors.bg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    width: "48%",
    overflow: "hidden",
  },
  setText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
    marginBottom: 4,
  },
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.surfaceAlt,
  },
  progressBarContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.surfaceAlt,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
  },
});
