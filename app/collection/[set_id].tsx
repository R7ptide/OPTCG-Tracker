import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { useFilters } from "../../hooks/useFilters";
import { useCardQuantityActions } from "../../hooks/useCardQuantityActions";
import { getOwnedForSet } from "../../repositories/collection";
import { getCardsForSet } from "../../repositories/cards";
import { RARITY_MAP } from "../../constants/gameData";
import { radius, spacing, typography, type ThemeColors } from "../../constants/theme";
import { buildCollectionCards } from "../../utils/collectionCards";
import CardModal, { type CollectionCard } from "../../components/CardModal";
import FilterDrawer from "../../components/FilterDrawer";

export default function SetDetails() {
  const params = useLocalSearchParams<{ set_id: string }>();
  const set_id = params.set_id;
  const { showMissing, colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { filters, setSearchName, toggle } = useFilters();

  const [dbVersion, setDbVersion] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { masterCards, setStats } = useMemo(() => {
    const ownedData = getOwnedForSet(set_id);
    const masterData = getCardsForSet(set_id);
    const masterList = buildCollectionCards(masterData, ownedData);

    return {
      masterCards: masterList,
      setStats: {
        unique: masterList.filter((c) => c.owned).length,
        total: masterList.length,
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dbVersion is an intentional invalidation trigger
  }, [set_id, dbVersion]);

  const displayCards = masterCards.filter((card) => {
    if (!showMissing && !card.owned) return false;
    if (
      filters.searchName &&
      !card.name.toLowerCase().includes(filters.searchName.toLowerCase())
    )
      return false;
    if (
      filters.colors.length > 0 &&
      !filters.colors.some((c) => card.color.includes(c))
    )
      return false;
    if (filters.types.length > 0 && !filters.types.includes(card.type))
      return false;

    if (filters.rarities.length > 0) {
      const matchesRarity = filters.rarities.some((shortRarity) => {
        const fullRarity = RARITY_MAP[shortRarity];
        return (
          card.rarity &&
          card.rarity.toLowerCase().includes(fullRarity.toLowerCase())
        );
      });
      if (!matchesRarity) return false;
    }
    return true;
  });

  const { handleIncrement, handleDecrement } = useCardQuantityActions(
    selectedCard,
    setSelectedCard,
    () => setDbVersion((v) => v + 1),
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              style={styles.headerIcon}
            >
              <Ionicons name="filter" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.headerBox}>
        <Text style={styles.title}>{set_id} Collection</Text>
        <Text style={styles.statsText}>
          {setStats.unique} / {setStats.total} Unique Variants Collected
        </Text>
      </View>

      <FlatList
        data={displayCards}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        renderItem={({ item }) => {
          const isLeader = item.type && item.type.toLowerCase() === "leader";
          const isComplete = isLeader
            ? item.quantity >= 1
            : item.playsetTotal >= 4;

          return (
            <TouchableOpacity
              style={styles.cardSlot}
              onPress={() => setSelectedCard(item)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={[
                  styles.cardImage,
                  item.owned ? styles.imageOwned : styles.imageMissing,
                ]}
                resizeMode="contain"
              />
              {item.owned && (
                <View style={styles.qtyBadge}>
                  <Text
                    style={[
                      styles.qtyText,
                      { color: isComplete ? colors.accent : colors.warning },
                    ]}
                  >
                    x{item.quantity}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No cards found matching these filters.
          </Text>
        }
      />

      <FilterDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        filters={filters}
        setSearchName={setSearchName}
        toggle={toggle}
      />

      <CardModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.sm },
  headerIcon: { paddingRight: spacing.sm },
  headerBox: { marginBottom: spacing.md, alignItems: "center" },
  title: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
  },
  statsText: {
    color: colors.textMuted,
    fontSize: typography.sizes.md,
    marginTop: spacing.xs,
  },
  cardSlot: {
    flex: 1,
    margin: spacing.xs,
    aspectRatio: 0.7,
    borderRadius: radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  cardImage: { width: "100%", height: "100%", borderRadius: radius.sm },
  imageOwned: { opacity: 1 },
  imageMissing: { opacity: 0.2 },
  qtyBadge: {
    position: "absolute",
    bottom: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.overlayBadge,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  qtyText: { fontSize: typography.sizes.sm, fontWeight: "bold" },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 50 },
});
