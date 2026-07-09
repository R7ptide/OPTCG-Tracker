import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, typography } from "../constants/theme";

export default function Decks() {
  return (
    <View style={styles.container}>
      <Ionicons
        name="hammer-outline"
        size={64}
        color={colors.textMuted}
        style={styles.icon}
      />
      <Text style={styles.title}>Deck Builder</Text>
      <Text style={styles.subtitle}>Coming in the next update!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  icon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
  },
});
