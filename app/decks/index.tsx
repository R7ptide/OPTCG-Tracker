import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { getDecks, type DeckWithSummary } from "../../repositories/decks";
import { getSetLabel, resolveCardImage } from "../../utils/cards";
import { DECK_SIZE } from "../../constants/deckRules";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";

export default function DeckList() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [decks, setDecks] = useState<DeckWithSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      setDecks(getDecks());
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={decks}
        keyExtractor={(item) => String(item.id)}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/decks/${item.id}`)}
          >
            {item.leader_id ? (
              <Image
                source={{
                  uri: resolveCardImage(item.leader_id, item.leaderImageUrl),
                }}
                placeholder={require("../../assets/images/leader-card-back.png")}
                transition={200}
                style={styles.leaderThumb}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
            ) : (
              <View style={[styles.leaderThumb, styles.leaderThumbPlaceholder]}>
                <Ionicons
                  name="help-outline"
                  size={20}
                  color={colors.textMuted}
                />
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.leaderName && (
                <Text style={styles.cardSubtitle}>
                  {item.leaderName}
                  {item.leader_id ? ` (${getSetLabel(item.leader_id)})` : ""}
                </Text>
              )}
            </View>

            <Text
              style={[
                styles.countText,
                item.cardCount === DECK_SIZE
                  ? styles.countTextComplete
                  : styles.countTextIncomplete,
              ]}
            >
              {item.cardCount}/{DECK_SIZE}
            </Text>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="albums-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              No decks yet. Build your first one below.
            </Text>
          </View>
        }
      />

      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/decks/new")}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add New Deck</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    flatList: { flex: 1 },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    leaderThumb: {
      width: 40,
      height: 56,
      borderRadius: radius.sm,
    },
    leaderThumbPlaceholder: {
      backgroundColor: colors.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    cardInfo: { flex: 1 },
    cardTitle: {
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    cardSubtitle: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
    countText: {
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      marginRight: spacing.xs,
    },
    countTextComplete: { color: colors.accent },
    countTextIncomplete: { color: colors.warning },
    empty: {
      alignItems: "center",
      marginTop: spacing.xxl * 2,
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      textAlign: "center",
    },
    footer: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    addButton: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
    },
    addButtonText: {
      color: "#fff",
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
  });
