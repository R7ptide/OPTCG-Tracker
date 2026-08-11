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
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { searchTournaments } from "../../repositories/tournaments";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";
import { formatDateDisplay } from "../../utils/date";
import { cardImageUrl } from "../../utils/cards";
import { useSettings } from "../../contexts/SettingsContext";

export default function TournamentSearch() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dbVersion] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 200);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];

    return searchTournaments(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dbVersion is an intentional invalidation trigger
  }, [debouncedQuery, dbVersion]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.placeholder} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search a Tournament across all you've played..."
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoFocus
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

      <FlatList
        data={results}
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
                  uri: cardImageUrl(item.leader_id),
                }}
                style={styles.leaderThumb}
                resizeMode="cover"
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
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDate}>
                {formatDateDisplay(item.event_date)}
                {item.leaderName ? ` · ${item.leaderName}` : ""}
              </Text>
              <View style={styles.recordRow}>
                <Text style={styles.formatText}>{item.format}</Text>
                <Text style={styles.recordText}>
                  {item.wins}W - {item.losses}L
                </Text>
                {item.placement != null && (
                  <Text style={styles.placementText}>#{item.placement}</Text>
                )}
              </View>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {debouncedQuery
              ? "No Tournaments found."
              : "Type a Tournament name or a Leader card to search your Tournaments."}
          </Text>
        }
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
    headerIcon: { paddingRight: spacing.sm },
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
    formatText: {
      color: colors.text,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
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
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      textAlign: "center",
      marginTop: 50,
    },
  });
