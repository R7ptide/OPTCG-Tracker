import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../_layout";
import { getTournaments, type TournamentWithRecord } from "../../repositories/tournaments";
import { getCardById } from "../../repositories/cards";
import { formatDateDisplay } from "../../utils/date";
import { radius, spacing, typography, type ThemeColors } from "../../constants/theme";

type TournamentListItem = TournamentWithRecord & { leaderName: string | null };

const loadTournaments = (): TournamentListItem[] => {
  return getTournaments().map((tournament) => ({
    ...tournament,
    leaderName: tournament.leader_id
      ? getCardById(tournament.leader_id)?.name ?? null
      : null,
  }));
};

export default function TournamentList() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      setTournaments(loadTournaments());
    }, []),
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tournaments}
        keyExtractor={(item) => String(item.id)}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/tournaments/${item.id}`)}
          >
            {item.leader_id ? (
              <Image
                source={{
                  uri: `https://en.onepiece-cardgame.com/images/cardlist/card/${item.leader_id}.png`,
                }}
                style={styles.leaderThumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.leaderThumb, styles.leaderThumbPlaceholder]}>
                <Ionicons name="help-outline" size={20} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {formatDateDisplay(item.event_date)}
                {item.leaderName ? ` · ${item.leaderName}` : ""}
              </Text>
              <View style={styles.recordRow}>
                <Text style={styles.recordText}>
                  {item.wins}W - {item.losses}L
                </Text>
                {item.placement != null && (
                  <Text style={styles.placementText}>#{item.placement}</Text>
                )}
              </View>
            </View>

            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trophy-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              No tournaments yet. Add your first one below.
            </Text>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/tournaments/new")}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add New Tournament</Text>
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
    cardDate: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
    recordRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    recordText: {
      color: colors.accent,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
    placementText: {
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
