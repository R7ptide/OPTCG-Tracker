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
import CardFilterDrawer, {
  type CardFilterGroup,
} from "../../../components/CardFilterDrawer";
import {
  getDeckCards,
  getDeckSummaryById,
  setDeckCardQuantity,
  type DeckCardWithInfo,
  type DeckWithSummary,
} from "../../../repositories/decks";
import {
  getCardById,
  getCardsByColors,
  searchCardsByName,
  type MasterCardRow,
} from "../../../repositories/cards";
import {
  getSetLabel,
  isAlternateArt,
  resolveCardImage,
} from "../../../utils/cards";
import { DECK_SIZE, getCardCopyLimit } from "../../../constants/deckRules";
import { isColorLegal, splitColors } from "../../../utils/deckValidation";
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

type FilterKey = "type" | "rarity" | "cost" | "counter";

const FILTER_GROUPS: readonly CardFilterGroup[] = [
  { key: "type", label: "Card Type", options: ["Character", "Event", "Stage"] },
  {
    key: "rarity",
    label: "Rarity",
    options: ["C", "UC", "R", "SR", "SEC", "SP", "TR"],
  },
  {
    key: "cost",
    label: "Cost",
    options: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  },
  { key: "counter", label: "Counter", options: ["1000", "2000"] },
];

const EMPTY_FILTERS: Record<FilterKey, string[]> = {
  type: [],
  rarity: [],
  cost: [],
  counter: [],
};

const TYPE_SORT_ORDER: Record<string, number> = {
  Character: 0,
  Event: 1,
  Stage: 2,
};

const byTypeThenCost = (
  a: { type?: string | null; cost?: number | null },
  b: { type?: string | null; cost?: number | null },
): number => {
  const typeDiff =
    (TYPE_SORT_ORDER[a.type ?? ""] ?? 99) - (TYPE_SORT_ORDER[b.type ?? ""] ?? 99);
  if (typeDiff !== 0) return typeDiff;
  return (a.cost ?? 0) - (b.cost ?? 0);
};

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
  const [filters, setFilters] =
    useState<Record<FilterKey, string[]>>(EMPTY_FILTERS);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const toggleFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const k = key as FilterKey;
      const arr = prev[k];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [k]: next };
    });
  };

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

  const activeFilterCount = Object.values(filters).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  const searchResults = useMemo(() => {
    if (activeTab !== "search") return [];

    const trimmed = query.trim();
    const pool = trimmed
      ? searchCardsByName(trimmed)
      : getCardsByColors(splitColors(leaderCard?.color));

    return pool.filter((c) => {
      if (c.type === "Leader") return false;
      if (isAlternateArt(c.id)) return false;
      if (!isColorLegal(c.color, leaderCard?.color)) return false;
      if (filters.type.length && !filters.type.includes(c.type ?? "")) {
        return false;
      }
      if (filters.rarity.length && !filters.rarity.includes(c.rarity ?? "")) {
        return false;
      }
      if (filters.cost.length && !filters.cost.includes(String(c.cost ?? ""))) {
        return false;
      }
      if (
        filters.counter.length &&
        !filters.counter.includes(String(c.counter ?? ""))
      ) {
        return false;
      }
      return true;
    });
  }, [activeTab, query, leaderCard, filters]);

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
        placeholder={
          card.type === "Leader"
            ? require("../../../assets/images/leader-card-back.png")
            : require("../../../assets/images/card-back.png")
        }
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

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: deck?.name ?? "Deck",
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push(`/decks/${deckId}/settings`)}
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
            <TouchableOpacity
              disabled={!leaderCard}
              onPress={() => leaderCard && setSelectedCard(leaderCard)}
            >
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
            </TouchableOpacity>
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
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={18} color={colors.placeholder} />
            <TextInput
              style={styles.searchInput}
              placeholder="Name, trait, set (OP16), card (OP16-003)"
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

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterDrawerOpen(true)}
          >
            <Ionicons name="filter" size={20} color={colors.text} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        key={activeTab}
        style={styles.flatList}
        contentContainerStyle={styles.listContent}
        numColumns={activeTab === "search" ? 4 : 3}
        data={
          activeTab === "search"
            ? searchResults
            : deckCards.slice().sort(byTypeThenCost)
        }
        keyExtractor={(item) => item.id}
        renderItem={({ item }) =>
          renderGridCard(item, quantities[item.id] ?? 0)
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {activeTab === "search"
              ? leaderCard
                ? "No cards found."
                : "Pick a leader first to browse cards."
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
        readOnly={selectedCard?.type === "Leader"}
      />

      <CardFilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        groups={FILTER_GROUPS}
        isActive={(key, opt) => filters[key as FilterKey].includes(opt)}
        onToggle={toggleFilter}
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
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      margin: spacing.md,
      marginBottom: 0,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButton: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
    },
    filterBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      minWidth: 16,
      height: 16,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 2,
    },
    filterBadgeText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      paddingVertical: spacing.sm,
      fontSize: typography.sizes.md,
    },
    flatList: { flex: 1 },
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
      color: colors.text,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      textAlign: "center",
      marginTop: spacing.xl,
    },
  });
