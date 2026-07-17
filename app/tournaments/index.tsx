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
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../_layout";
import { getTournaments, type TournamentWithRecord } from "../../repositories/tournaments";
import { getCardById } from "../../repositories/cards";
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
                resizeMode="contain"
              />
            ) : (
              <View style={[styles.leaderThumb, styles.leaderThumbPlaceholder]}>
                <Ionicons name="help-outline" size={20} color={colors.textMuted} />
              </View>
            )}

            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.leaderName && (
                <Text style={styles.cardLeader}>{item.leaderName}</Text>
              )}
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
              No tournaments yet. Tap + to log your first one.
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/tournaments/new")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
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
    cardLeader: {
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
    fab: {
      position: "absolute",
      right: spacing.lg,
      bottom: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      elevation: 4,
      shadowColor: "#000",
      shadowOpacity: 0.3,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
  });
