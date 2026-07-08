import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import {
  MAIN_SETS,
  EXTRA_BOOSTERS,
  PREMIUM_BOOSTERS,
} from "../../constants/gameData";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function CollectionMenu() {
  const navigateToSet = (setId: string) => router.push(`/collection/${setId}`);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Special & Promos</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.setCardHalf}
          onPress={() => router.push("/collection/starters")}
        >
          <Text style={styles.setText}>Starter Decks (ST)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.setCardHalf}
          onPress={() => navigateToSet("P")}
        >
          <Text style={styles.setText}>Promos (P)</Text>
        </TouchableOpacity>

        {PREMIUM_BOOSTERS.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCardHalf}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.header}>Main Expansions</Text>
      <View style={styles.grid}>
        {MAIN_SETS.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCardHalf}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.header}>Extra Boosters</Text>
      <View style={styles.grid}>
        {EXTRA_BOOSTERS.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCardHalf}
            onPress={() => navigateToSet(set)}
          >
            <Text style={styles.setText}>{set}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.md },
  header: {
    color: colors.textMuted,
    fontSize: typography.sizes.xl,
    fontWeight: "bold",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  setCardHalf: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.sm,
    width: "48%",
    alignItems: "center",
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setText: { color: colors.text, fontSize: typography.sizes.lg, fontWeight: "bold" },
});
