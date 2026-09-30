import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { router, Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../../contexts/SettingsContext";
import CardModal, { type CollectionCard } from "../../../components/CardModal";
import {
  getDeckCards,
  getDeckSummaryById,
  setDeckCardQuantity,
  type DeckCardWithInfo,
  type DeckWithSummary,
} from "../../../repositories/decks";
import {
  getCardById,
  searchCardsByName,
  type MasterCardRow,
} from "../../../repositories/cards";
import { getSetLabel, resolveCardImage } from "../../../utils/cards";
import { DECK_SIZE, getCardCopyLimit } from "../../../constants/deckRules";
import { isColorLegal } from "../../../utils/deckValidation";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../../constants/theme";

type Tab = "deck" | "search";

const TABS: { key: Tab; label: string }[] = [
  { key: "deck", label: "Deck" },
  { key: "search", label: "Search Cards" },
];

export default function DeckDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [deck, setDeck] = useState<DeckWithSummary | null>(null);
  const [leaderCard, setLeaderCard] = useState<MasterCardRow | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCardWithInfo[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("deck");
  const [query, setQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<MasterCardRow | null>(null);

  const reload = useCallback(() => {
    const summary = getDeckSummaryById(deckId);
    setDeck(summary);
    setLeaderCard(summary?.leader_id ? getCardById(summary.leader_id) : null);
    setDeckCards(getDeckCards(deckId));
  }, [deckId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const quantities = useMemo(() => {
    const map: Record<string, number> = {};
    deckCards.forEach((c) => {
      map[c.card_id] = c.quantity;
    });
    return map;
  }, [deckCards]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchCardsByName(query).filter((c) => c.type !== "Leader");
  }, [query]);

  const adjustQuantity = (card: MasterCardRow, delta: number) => {
    const current = quantities[card.id] ?? 0;
    const limit = getCardCopyLimit(card.id);
    const next = Math.max(0, Math.min(limit, current + delta));
    setDeckCardQuantity(deckId, card.id, next);
    reload();
  };

  const selectedCollectionCard = useMemo((): CollectionCard | null => {
    if (!selectedCard) return null;
    return {
      id: selectedCard.id,
      name: selectedCard.name ?? "",
      color: selectedCard.color ?? "",
      type: selectedCard.type ?? "",
      rarity: selectedCard.rarity ?? "",
      attribute: selectedCard.attribute ?? "",
      traits: selectedCard.traits ?? "",
      cost: selectedCard.cost,
      imageUrl: resolveCardImage(selectedCard.id, selectedCard.image_url),
      owned: true,
      quantity: quantities[selectedCard.id] ?? 0,
      playsetTotal: getCardCopyLimit(selectedCard.id),
    };
  }, [selectedCard, quantities]);

  const renderGridCard = (card: MasterCardRow, quantity: number) => (
    <TouchableOpacity
      key={card.id}
      style={styles.cardSlot}
      onPress={() => setSelectedCard(card)}
    >
      <Image
        source={{ uri: resolveCardImage(card.id, card.image_url) }}
        placeholder={require("../../../assets/images/leader-card-back.png")}
        transition={200}
        style={styles.cardImage}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
      <View style={styles.qtyBadge}>
        <Text style={styles.qtyText}>x{quantity}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCardRow = (card: MasterCardRow, quantity: number) => {
    const legal = isColorLegal(card.color, leaderCard?.color);
    return (
      <View key={card.id} style={styles.cardRow}>
        <Image
          source={{ uri: resolveCardImage(card.id, card.image_url) }}
          placeholder={require("../../../assets/images/leader-card-back.png")}
          transition={200}
          style={styles.cardThumb}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
        <View style={styles.cardRowInfo}>
          <Text style={styles.cardRowName} numberOfLines={1}>
            {card.name}
          </Text>
          {!legal && (
            <Text style={styles.cardRowWarning}>Wrong color for leader</Text>
          )}
        </View>
        <View style={styles.stepper}>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => adjustQuantity(card, -1)}
          >
            <Ionicons name="remove" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.stepperCount}>{quantity}</Text>
          <TouchableOpacity
            style={styles.stepperButton}
            onPress={() => adjustQuantity(card, 1)}
          >
            <Ionicons name="add" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: deck?.name ?? "Deck",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/decks/${deckId}/edit`)}
              style={styles.headerIcon}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={22}
                color={colors.text}
              />
            </TouchableOpacity>
          ),
        }}
      />

      {deck && (
        <View style={styles.card}>
          {deck.leader_id ? (
            <Image
              source={{
                uri: resolveCardImage(deck.leader_id, deck.leaderImageUrl),
              }}
              placeholder={require("../../../assets/images/leader-card-back.png")}
              transition={200}
              style={styles.leaderThumb}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={[styles.leaderThumb, styles.leaderThumbPlaceholder]}>
              <Ionicons
                name="help-outline"
                size={28}
                color={colors.textMuted}
              />
            </View>
          )}

          <Text style={styles.leaderName} numberOfLines={1}>
            {deck.leaderName
              ? `${deck.leaderName} (${getSetLabel(deck.leader_id!)})`
              : "No leader selected"}
          </Text>

          <Text
            style={[
              styles.countText,
              deck.cardCount === DECK_SIZE
                ? styles.countTextComplete
                : styles.countTextIncomplete,
            ]}
          >
            {deck.cardCount}/{DECK_SIZE}
          </Text>
        </View>
      )}

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

      {activeTab === "search" && (
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, attribute, trait..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.placeholder}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        key={activeTab}
        style={styles.flatList}
        contentContainerStyle={styles.listContent}
        numColumns={activeTab === "deck" ? 3 : 1}
        data={
          activeTab === "search"
            ? searchResults
            : deckCards
                .slice()
                .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          activeTab === "deck"
            ? renderGridCard(item, quantities[item.id] ?? 0)
            : renderCardRow(item, quantities[item.id] ?? 0)
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === "search"
              ? query.trim()
                ? "No cards found."
                : "Search above to add cards."
              : "No cards in this deck yet. Use Search Cards to add some."}
          </Text>
        }
      />

      <CardModal
        card={selectedCollectionCard}
        onClose={() => setSelectedCard(null)}
        onIncrement={() => selectedCard && adjustQuantity(selectedCard, 1)}
        onDecrement={() => selectedCard && adjustQuantity(selectedCard, -1)}
        quantityLabel="In Deck"
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    headerIcon: { paddingRight: spacing.sm },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      margin: spacing.md,
    },
    leaderThumb: {
      width: 64,
      aspectRatio: 0.7,
      borderRadius: radius.md,
    },
    leaderThumbPlaceholder: {
      backgroundColor: colors.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    leaderName: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    countText: {
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
    countTextComplete: { color: colors.accent },
    countTextIncomplete: { color: colors.warning },
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
    tabActive: { borderBottomColor: colors.primary },
    tabText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    tabTextActive: { color: colors.text },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surface,
      margin: spacing.md,
      marginBottom: 0,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      paddingVertical: spacing.sm,
      fontSize: typography.sizes.md,
    },
    flatList: { flex: 1 },
    listContent: { padding: spacing.md, paddingBottom: spacing.xxl },
    cardRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.xs,
    },
    cardThumb: { width: 36, height: 50, borderRadius: radius.sm },
    cardRowInfo: { flex: 1 },
    cardRowName: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    cardRowWarning: { color: colors.warning, fontSize: typography.sizes.xs },
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
      color: colors.text,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
    stepper: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    stepperButton: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      padding: spacing.xs,
    },
    stepperCount: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
      minWidth: 20,
      textAlign: "center",
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      textAlign: "center",
      marginTop: spacing.xl,
    },
  });
