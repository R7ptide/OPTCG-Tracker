import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useState } from "react";
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
};

function SetBox({ title, sets, onPress }: SetBoxProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.boxTitle}>{title}</Text>
      <View style={styles.grid}>
        {sets.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCard}
            onPress={() => onPress(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function CollectionMenu() {
  const [activeTab, setActiveTab] = useState<Tab>("main");
  const navigateToSet = (setId: string) => router.push(`/collection/${setId}`);

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

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {activeTab === "main" && (
          <>
            <SetBox title="One Piece" sets={MAIN_SETS} onPress={navigateToSet} />
            <SetBox
              title="Extra Boosters"
              sets={EXTRA_BOOSTERS}
              onPress={navigateToSet}
            />
            <SetBox
              title="Premium Boosters"
              sets={PREMIUM_BOOSTERS}
              onPress={navigateToSet}
            />
          </>
        )}

        {activeTab === "special" && (
          <SetBox title="Promos" sets={["P"]} onPress={navigateToSet} />
        )}

        {activeTab === "sts" && (
          <SetBox
            title="Starter Decks"
            sets={STARTER_DECKS}
            onPress={navigateToSet}
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    width: "48%",
  },
  setText: {
    color: colors.text,
    fontSize: typography.sizes.md,
    fontWeight: "bold",
  },
});
