import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
} from "react-native";
import { useState, useMemo, useCallback } from "react";
import { useFocusEffect } from "expo-router";
//import { Ionicons } from "@expo/vector-icons";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";
import { useSettings } from "../_layout";
import {
  getTournaments,
  type TournamentWithRecord,
} from "../../repositories/tournaments";
import { getCardById } from "../../repositories/cards";

type Tab = "over" | "match";

const TABS: { key: Tab; label: string }[] = [
  { key: "over", label: "Overview" },
  { key: "match", label: "Matchups" },
];

type TournamentListItem = TournamentWithRecord & { leaderName: string | null };

const loadTournaments = (): TournamentListItem[] => {
  return getTournaments().map((tournament) => ({
    ...tournament,
    leaderName: tournament.leader_id
      ? (getCardById(tournament.leader_id)?.name ?? null)
      : null,
  }));
};

export default function StatisticsMenu() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("over");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");

  useFocusEffect(
    useCallback(() => {
      setTournaments(loadTournaments());
    }, []),
  );

  const availableFormats = useMemo(() => {
    const formats = Array.from(new Set(tournaments.map((t) => t.format)));
    formats.sort((a, b) => {
      if (a === "Legacy") return -1;
      if (b === "Legacy") return 1;
      return b.localeCompare(a);
    });
    return ["All", ...formats];
  }, [tournaments]);

  const filteredTournaments = useMemo(() => {
    if (selectedFormat === "All") return tournaments;
    return tournaments.filter((t) => t.format === selectedFormat);
  }, [tournaments, selectedFormat]);

  // calculate overview stats
  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let tournamentsWon = 0;
    const leaderRecords: Record<string, { wins: number; losses: number }> = {};

    filteredTournaments.forEach((t) => {
      wins += t.wins;
      losses += t.losses;
      if (t.placement === 1) tournamentsWon++;

      if (t.leader_id) {
        if (!leaderRecords[t.leader_id]) {
          leaderRecords[t.leader_id] = { wins: 0, losses: 0 };
        }
        leaderRecords[t.leader_id].wins += t.wins;
        leaderRecords[t.leader_id].losses += t.losses;
      }
    });

    const totalMatches = wins + losses;
    const winRate =
      totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

    const topDecks = Object.entries(leaderRecords)
      .map(([id, record]) => {
        const deckMatches = record.wins + record.losses;
        const deckRate =
          deckMatches > 0 ? Math.round((record.wins / deckMatches) * 100) : 0;
        return {
          leaderId: id,
          wins: record.wins,
          losses: record.losses,
          winRate: deckRate,
          totalMatches: deckMatches,
        };
      })
      .sort((a, b) => b.winRate - a.winRate || b.totalMatches - a.totalMatches)
      .slice(0, 3);

    return {
      wins,
      losses,
      winRate,
      tournamentsCount: filteredTournaments.length,
      tournamentsWon,
      topDecks,
    };
  }, [filteredTournaments]);

  return (
    <View style={styles.wrapper}>
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

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {activeTab === "over" && (
          <View style={styles.overviewContainer}>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{stats.wins}</Text>
                </View>
                <View style={styles.statLabelContainer}>
                  <Text style={styles.statLabel}>WINS</Text>
                </View>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{stats.losses}</Text>
                </View>
                <View style={styles.statLabelContainer}>
                  <Text style={styles.statLabel}>LOSSES</Text>
                </View>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statValueContainer}>
                  <Text
                    style={[
                      styles.statValue,
                      { color: stats.winRate >= 50 ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {stats.winRate}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.statLabelContainer,
                    {
                      backgroundColor:
                        stats.winRate >= 50 ? "#10B981" : "#EF4444",
                    },
                  ]}
                >
                  <Text style={styles.statLabel}>WIN RATE</Text>
                </View>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{stats.tournamentsCount}</Text>
                </View>
                <View style={styles.statLabelContainer}>
                  <Text style={styles.statLabel}>TOURNAMENTS</Text>
                </View>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statValueContainer}>
                  <Text style={styles.statValue}>{stats.tournamentsWon}</Text>
                </View>
                <View style={styles.statLabelContainer}>
                  <Text style={styles.statLabel}>TOURNAMENT WINS</Text>
                </View>
              </View>
            </View>

            {stats.topDecks.length > 0 && (
              <View style={styles.topDecksSection}>
                <Text style={styles.sectionTitle}>Top Performing Decks</Text>
                <View style={styles.topDecksRow}>
                  {stats.topDecks.map((deck, index) => {
                    const podiumBackgrounds = [
                      "rgba(255, 215, 0, 0.15)",
                      "rgba(192, 192, 192, 0.15)",
                      "rgba(205, 127, 50, 0.15)",
                    ];

                    return (
                      <View
                        key={`${deck.leaderId}-${index}`}
                        style={[
                          styles.deckCard,
                          { backgroundColor: podiumBackgrounds[index] },
                        ]}
                      >
                        <Image
                          source={{
                            uri: `https://en.onepiece-cardgame.com/images/cardlist/card/${deck.leaderId}.png`,
                          }}
                          style={styles.deckImage}
                          resizeMode="cover"
                        />
                        <Text style={[styles.deckRate, { color: colors.text }]}>
                          {deck.winRate}%
                        </Text>
                        <Text
                          style={[styles.deckRecord, { color: colors.text }]}
                        >
                          {deck.wins}W - {deck.losses}L
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === "match" && <Text>Matchups</Text>}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.bg,
    },
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
    tabActive: {
      borderBottomColor: colors.primary,
    },
    tabText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    tabTextActive: {
      color: colors.text,
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
    container: {
      flex: 1,
    },
    content: {
      padding: spacing.md,
    },

    // Overview Styles
    overviewContainer: {
      gap: spacing.md,
    },
    statRow: {
      flexDirection: "row",
      gap: spacing.md,
    },
    statBox: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    statValueContainer: {
      paddingVertical: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: {
      color: colors.text,
      fontSize: typography.sizes.xl * 1.2,
      fontWeight: "bold",
    },
    statLabelContainer: {
      backgroundColor: colors.surfaceAlt,
      paddingVertical: spacing.xs,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statLabel: {
      color: colors.text,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
      letterSpacing: 1,
    },
    topDecksSection: {
      marginTop: spacing.sm,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
      marginBottom: spacing.md,
    },
    topDecksRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    deckCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      alignItems: "center",
    },
    deckImage: {
      width: 60,
      height: 84,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
    },
    deckRate: {
      color: colors.textMuted,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    deckRecord: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
  });
