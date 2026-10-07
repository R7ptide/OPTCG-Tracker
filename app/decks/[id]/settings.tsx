import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import {
  deleteDeck,
  getDeckCards,
  getDeckSummaryById,
  updateDeckMeta,
  type DeckCardWithInfo,
  type DeckWithSummary,
} from "../../../repositories/decks";
import { getCardById, type MasterCardRow } from "../../../repositories/cards";
import { formatSimList, resolveCardImage } from "../../../utils/cards";
import { computeDeckStats } from "../../../utils/deckStats";
import DeckExportView from "../../../components/DeckExportView";
import { useSettings } from "../../../contexts/SettingsContext";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../../constants/theme";

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

export default function DeckSettings() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deckId = Number(id);
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [deck, setDeck] = useState<DeckWithSummary | null>(null);
  const [leaderCard, setLeaderCard] = useState<MasterCardRow | null>(null);
  const [deckCards, setDeckCards] = useState<DeckCardWithInfo[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const exportViewRef = useRef<View>(null);

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

  const stats = useMemo(() => computeDeckStats(deckCards), [deckCards]);
  const maxCurve = Math.max(1, ...stats.costCurve);

  const startEditingName = () => {
    setNameDraft(deck?.name ?? "");
    setIsEditingName(true);
  };

  const confirmNameEdit = () => {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Give your deck a name first.");
      return;
    }
    updateDeckMeta(deckId, { name: trimmed, leaderId: deck?.leader_id });
    setIsEditingName(false);
    reload();
  };

  const handleExport = async () => {
    if (!deck || isExporting) return;
    setIsExporting(true);
    try {
      const urls = [
        leaderCard && resolveCardImage(leaderCard.id, leaderCard.image_url),
        ...deckCards.map((c) => resolveCardImage(c.card_id, c.image_url)),
      ].filter((u): u is string => !!u);

      await Promise.all(urls.map((u) => Image.prefetch(u).catch(() => {})));
      // Let the off-screen view settle one frame after the images resolve
      // from cache before the capture reads its pixels.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const uri = await captureRef(exportViewRef, {
        format: "png",
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        dialogTitle: `${deck.name}.png`,
      });
    } catch (err) {
      Alert.alert("Export failed", "Could not generate the deck image.");
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyForSim = async () => {
    await Clipboard.setStringAsync(
      formatSimList([
        ...(leaderCard ? [{ id: leaderCard.id, quantity: 1 }] : []),
        ...deckCards.map((c) => ({ id: c.card_id, quantity: c.quantity })),
      ]),
    );
    Alert.alert("Copied", "Deck list copied for the simulator.");
  };

  const handleDelete = () => {
    Alert.alert("Delete Deck", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteDeck(deckId);
          router.replace("/decks");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.nameRow}>
        {isEditingName ? (
          <>
            <TextInput
              style={styles.nameInput}
              placeholder="Deck name"
              placeholderTextColor={colors.placeholder}
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              onSubmitEditing={confirmNameEdit}
            />
            <TouchableOpacity onPress={confirmNameEdit} style={styles.iconButton}>
              <Ionicons name="checkmark" size={22} color={colors.accent} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.nameText} numberOfLines={1}>
              {deck?.name ?? "Deck"}
            </Text>
            <TouchableOpacity
              onPress={startEditingName}
              style={styles.iconButton}
            >
              <Ionicons name="pencil" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.row}
        onPress={handleExport}
        disabled={isExporting}
      >
        <Ionicons name="share-outline" size={22} color={colors.text} />
        <Text style={styles.rowText}>Export Deck</Text>
        {isExporting ? (
          <ActivityIndicator color={colors.textMuted} />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} onPress={handleCopyForSim}>
        <Ionicons name="copy-outline" size={22} color={colors.text} />
        <Text style={styles.rowText}>Copy Deck List</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => router.push(`/decks/${deckId}/missing`)}
      >
        <Ionicons name="list-outline" size={22} color={colors.text} />
        <Text style={styles.rowText}>Missing Cards</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Deck Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.counter2k}</Text>
            <Text style={styles.statLabel}>2k Counter</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.counter1k}</Text>
            <Text style={styles.statLabel}>1k Counter</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.bricks}</Text>
            <Text style={styles.statLabel}>Bricks</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>
              {stats.averageCost.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Avg Cost</Text>
          </View>
        </View>

        <View style={styles.chart}>
          {stats.costCurve.map((count, cost) => (
            <View key={cost} style={styles.barColumn}>
              <Text style={styles.barCount}>{count || ""}</Text>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(2, (count / maxCurve) * 80) },
                  count === 0 && styles.barEmpty,
                ]}
              />
              <Text style={styles.barLabel}>
                {cost === stats.costCurve.length - 1 ? `${cost}+` : cost}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Deck</Text>
      </TouchableOpacity>

      <View style={styles.offscreen} pointerEvents="none">
        <DeckExportView
          ref={exportViewRef}
          deckName={deck?.name ?? "Deck"}
          leaderName={deck?.leaderName ?? null}
          colors={colors}
          cards={[
            ...(leaderCard
              ? [
                  {
                    id: leaderCard.id,
                    imageUrl: leaderCard.image_url,
                    quantity: 1,
                  },
                ]
              : []),
            ...deckCards
              .slice()
              .sort(byTypeThenCost)
              .map((c) => ({
                id: c.card_id,
                imageUrl: c.image_url,
                quantity: c.quantity,
              })),
          ]}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg, padding: spacing.lg },
    offscreen: { position: "absolute", top: -9999, left: 0 },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    nameText: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.xxl,
      fontWeight: "bold",
    },
    nameInput: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.xxl,
      fontWeight: "bold",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: spacing.xs,
    },
    iconButton: { padding: spacing.xs },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    rowText: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    statsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsTitle: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
      marginBottom: spacing.md,
      textAlign: "center",
    },
    statsRow: { flexDirection: "row", justifyContent: "space-around" },
    statBox: { alignItems: "center" },
    statNumber: {
      color: colors.accent,
      fontSize: typography.sizes.xxl,
      fontWeight: "bold",
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      textTransform: "uppercase",
      marginTop: spacing.xs,
    },
    chart: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginTop: spacing.lg,
      gap: 4,
    },
    barColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
    bar: {
      width: "100%",
      backgroundColor: colors.accent,
      borderRadius: 3,
    },
    barEmpty: { backgroundColor: colors.border },
    barCount: {
      color: colors.text,
      fontSize: typography.sizes.xs,
      height: 16,
    },
    barLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      marginTop: spacing.xs,
    },
    deleteButton: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.danger,
      marginTop: "auto",
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
  });
