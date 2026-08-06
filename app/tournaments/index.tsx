import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router, useFocusEffect, Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import {
  getTournaments,
  type TournamentWithRecord,
} from "../../repositories/tournaments";
import { formatDateDisplay } from "../../utils/date";
import { cardImageUrl } from "../../utils/cards";
import { useAvailableFormats } from "../../hooks/useAvailableFormats";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";

export default function TournamentList() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [tournaments, setTournaments] = useState<TournamentWithRecord[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<string>("All");

  useFocusEffect(
    useCallback(() => {
      setTournaments(getTournaments());
    }, []),
  );

  const availableFormats = useAvailableFormats(tournaments);

  const filteredTournaments = useMemo(() => {
    if (selectedFormat === "All") return tournaments;
    return tournaments.filter((t) => t.format === selectedFormat);
  }, [tournaments, selectedFormat]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push("/tournaments/search")}
              style={styles.headerIcon}
            >
              <Ionicons name="search" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {tournaments.length > 0 && (
        <View style={styles.filterWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {availableFormats.map((format) => {
              const isSelected = format === selectedFormat;
              return (
                <TouchableOpacity
                  key={format}
                  onPress={() => setSelectedFormat(format)}
                  style={[
                    styles.filterChip,
                    isSelected
                      ? styles.filterChipSelected
                      : styles.filterChipUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      isSelected
                        ? styles.filterTextSelected
                        : styles.filterTextUnselected,
                    ]}
                  >
                    {format}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredTournaments}
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
                source={{ uri: cardImageUrl(item.leader_id) }}
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
          <View style={styles.empty}>
            <Ionicons
              name="trophy-outline"
              size={48}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              No tournaments yet. Add your first one below.
            </Text>
          </View>
        }
      />

      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
      >
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
    filterWrapper: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterScroll: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
      borderWidth: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    filterChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipUnselected: {
      backgroundColor: "transparent",
      borderColor: colors.border,
    },
    filterText: {
      fontSize: typography.sizes.sm,
    },
    filterTextSelected: {
      color: "#fff",
      fontWeight: "bold",
    },
    filterTextUnselected: {
      color: colors.textMuted,
      fontWeight: "500",
    },
  });
