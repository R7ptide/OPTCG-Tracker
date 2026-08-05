import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { useMemo } from "react";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";
import { useSettings } from "../_layout";
import { useGameData } from "../../contexts/GameDataContext";

export default function StartersMenu() {
  const { starterDecks } = useGameData();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigateToSet = (setId: string) => router.push(`/collection/${setId}`);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Starter Decks</Text>

      <View style={styles.grid}>
        {starterDecks.map((set) => (
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
