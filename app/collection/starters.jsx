import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { STARTER_DECKS } from "../../constants/gameData";
import { colors, radius, spacing, typography } from "../../constants/theme";

export default function StartersMenu() {
  const navigateToSet = (setId) => router.push(`/collection/${setId}`);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Starter Decks</Text>

      <View style={styles.grid}>
        {STARTER_DECKS.map((set) => (
          <TouchableOpacity
            key={set}
            style={styles.setCard}
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
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  header: {
    color: colors.textMuted,
    fontSize: typography.sizes.xl,
    fontWeight: "bold",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between",
  },
  setCard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    width: "31%",
    alignItems: "center",
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  setText: {
    color: colors.text,
    fontSize: typography.sizes.lg,
    fontWeight: "bold",
  },
});
