import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { searchCardsByName } from "../../repositories/cards";
import { getCollectionRowsForCards } from "../../repositories/collection";
import { radius, spacing, typography, type ThemeColors } from "../../constants/theme";
import { useSettings } from "../../contexts/SettingsContext";
import { useCardQuantityActions } from "../../hooks/useCardQuantityActions";
import { buildCollectionCards } from "../../utils/collectionCards";
import CardModal, { type CollectionCard } from "../../components/CardModal";

export default function CardSearch() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dbVersion, setDbVersion] = useState(0);
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(
    null,
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo((): CollectionCard[] => {
    if (!debouncedQuery) return [];

    const masterData = searchCardsByName(debouncedQuery);
    const ownedRows = getCollectionRowsForCards(masterData.map((row) => row.id));

    return buildCollectionCards(masterData, ownedRows);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dbVersion is an intentional invalidation trigger
  }, [debouncedQuery, dbVersion]);

  const { handleIncrement, handleDecrement } = useCardQuantityActions(
    selectedCard,
    setSelectedCard,
    () => setDbVersion((v) => v + 1),
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search card name across all sets..."
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.placeholder} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={{ padding: spacing.sm, paddingBottom: spacing.xxl }}
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
            {debouncedQuery
              ? "No cards found matching that name."
              : "Type a card name to search your whole collection."}
          </Text>
        }
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
  container: { flex: 1, backgroundColor: colors.bg },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.surface,
    margin: spacing.sm,
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
