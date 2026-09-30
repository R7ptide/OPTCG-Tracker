import { View, Text, FlatList, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { getDeckCards, getDeckSummaryById } from "../../../repositories/decks";
import { getCardById, type MasterCardRow } from "../../../repositories/cards";
import { getOwnedCountsForBaseIds } from "../../../repositories/collection";
import { resolveCardImage } from "../../../utils/cards";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../../constants/theme";

type MissingCard = {
  card: MasterCardRow;
  needed: number;
  owned: number;
  missing: number;
};

export default function MissingCards() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [missingCards, setMissingCards] = useState<MissingCard[]>([]);

  const reload = useCallback(() => {
    const deck = getDeckSummaryById(deckId);
    const deckCards = getDeckCards(deckId);

    const needed: { card: MasterCardRow; quantity: number }[] = deckCards.map(
      (c) => ({
        card: {
          id: c.id,
          name: c.name,
          color: c.color,
          type: c.type,
          cost: c.cost,
          rarity: c.rarity,
          image_url: c.image_url,
          attribute: c.attribute,
          traits: c.traits,
          counter: c.counter,
        },
        quantity: c.quantity,
      }),
    );

    if (deck?.leader_id) {
      const leaderCard = getCardById(deck.leader_id);
      if (leaderCard) needed.push({ card: leaderCard, quantity: 1 });
    }

    const ownedMap = getOwnedCountsForBaseIds(needed.map((n) => n.card.id));

    const missing = needed
      .map(({ card, quantity }) => {
        const ownedQty = ownedMap[card.id] ?? 0;
        return {
          card,
          needed: quantity,
          owned: ownedQty,
          missing: Math.max(0, quantity - ownedQty),
        };
      })
      .filter((m) => m.missing > 0);

    setMissingCards(missing);
  }, [deckId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={missingCards}
        keyExtractor={(item) => item.card.id}
        numColumns={3}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.cardSlot}>
            <Image
              source={{
                uri: resolveCardImage(item.card.id, item.card.image_url),
              }}
              placeholder={
                item.card.type === "Leader"
                  ? require("../../../assets/images/leader-card-back.png")
                  : require("../../../assets/images/card-back.png")
              }
              transition={200}
              style={styles.cardImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>
                {item.owned}/{item.needed}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>All set!</Text>
            <Text style={styles.emptyText}>
              You own every card needed for this deck.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
    cardSlot: {
      flex: 1,
      margin: spacing.xs,
      aspectRatio: 0.7,
      borderRadius: radius.sm,
      justifyContent: "center",
      alignItems: "center",
    },
    cardImage: { width: "100%", height: "100%", borderRadius: radius.sm },
    qtyBadge: {
      position: "absolute",
      bottom: spacing.xs,
      right: spacing.xs,
      backgroundColor: colors.overlayBadge,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    qtyText: {
      color: colors.warning,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
    empty: {
      alignItems: "center",
      marginTop: spacing.xxl * 2,
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      textAlign: "center",
    },
  });
