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
  getMatchesForTournament,
  type TournamentWithRecord,
} from "../../repositories/tournaments";
import { type MatchRow } from "../../database";
import { getCardById } from "../../repositories/cards";

type Tab = "over" | "match";

const TABS: { key: Tab; label: string }[] = [
  { key: "over", label: "Overview" },
  { key: "match", label: "Matchups" },
];

type TournamentListItem = TournamentWithRecord & {
  leaderName: string | null;
  matches: MatchRow[];
};

const loadTournaments = (): TournamentListItem[] => {
  return getTournaments().map((tournament) => ({
    ...tournament,
    leaderName: tournament.leader_id
      ? (getCardById(tournament.leader_id)?.name ?? null)
      : null,
    matches: getMatchesForTournament(tournament.id),
  }));
};

const getSetLabel = (cardId: string) => cardId.split("-")[0] ?? "";

export default function StatisticsMenu() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("over");
  const [selectedFormat, setSelectedFormat] = useState<string>("All");
  const [selectedLeader, setSelectedLeader] = useState<string>("All");

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

  const availableLeaders = useMemo(() => {
    const leaderIds = Array.from(
      new Set(filteredTournaments.map((t) => t.leader_id).filter(Boolean)),
    );
    const leaders = leaderIds.map((id) => ({
      id: id as string,
      name: getCardById(id as string)?.name || "Unknown Leader",
    }));
    leaders.sort((a, b) => a.name.localeCompare(b.name));

    return [{ id: "All", name: "All leaders" }, ...leaders];
  }, [filteredTournaments]);

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

  // Matches stats
  const matchStats = useMemo(() => {
    const activeTournaments =
      selectedLeader === "All"
        ? filteredTournaments
        : filteredTournaments.filter((t) => t.leader_id === selectedLeader);

    let tournamentsCount = activeTournaments.length;
    let tournamentWins = 0;

    let totalMatches = 0;
    let totalWins = 0;
    let totalLosses = 0;

    let firstWins = 0,
      firstLosses = 0;
    let secondWins = 0,
      secondLosses = 0;

    let diceWonWins = 0,
      diceWonLosses = 0;
    let diceLostWins = 0,
      diceLostLosses = 0;

    const matchups: Record<
      string,
      {
        wins: number;
        losses: number;
        firstWins: number;
        firstLosses: number;
        secondWins: number;
        secondLosses: number;
      }
    > = {};

    activeTournaments.forEach((t) => {
      if (t.placement === 1) tournamentWins++;

      const matches = t.matches || [];

      matches.forEach((m) => {
        if (m.result === "BYE") return;

        totalMatches++;
        const isWin = m.result === "W";

        if (isWin) totalWins++;
        else totalLosses++;

        if (m.went_first === 1) {
          if (isWin) firstWins++;
          else firstLosses++;
        } else if (m.went_first === 0) {
          if (isWin) secondWins++;
          else secondLosses++;
        }

        if (m.dice_roll === 1) {
          if (isWin) diceWonWins++;
          else diceWonLosses++;
        } else if (m.dice_roll === 0) {
          if (isWin) diceLostWins++;
          else diceLostLosses++;
        }

        if (m.opponent_leader_id) {
          if (!matchups[m.opponent_leader_id]) {
            matchups[m.opponent_leader_id] = {
              wins: 0,
              losses: 0,
              firstWins: 0,
              firstLosses: 0,
              secondWins: 0,
              secondLosses: 0,
            };
          }

          if (isWin) matchups[m.opponent_leader_id].wins++;
          else matchups[m.opponent_leader_id].losses++;

          if (m.went_first === 1) {
            if (isWin) matchups[m.opponent_leader_id].firstWins++;
            else matchups[m.opponent_leader_id].firstLosses++;
          } else if (m.went_first === 0) {
            if (isWin) matchups[m.opponent_leader_id].secondWins++;
            else matchups[m.opponent_leader_id].secondLosses++;
          }
        }
      });
    });

    const winRate =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    const calcRate = (w: number, l: number) =>
      w + l > 0 ? Math.round((w / (w + l)) * 100) : 0;

    const opponentList = Object.entries(matchups)
      .map(([oppId, data]) => {
        return {
          oppId,
          oppName: getCardById(oppId)?.name || "Unknown",
          wins: data.wins,
          losses: data.losses,
          generalRate: calcRate(data.wins, data.losses),
          firstRate: calcRate(data.firstWins, data.firstLosses),
          secondRate: calcRate(data.secondWins, data.secondLosses),
        };
      })
      .sort(
        (a, b) =>
          b.generalRate - a.generalRate ||
          b.wins + b.losses - (a.wins + a.losses),
      );

    return {
      tournamentsCount,
      tournamentWins,
      totalMatches,
      totalWins,
      totalLosses,
      winRate,
      first: {
        wins: firstWins,
        losses: firstLosses,
        rate: calcRate(firstWins, firstLosses),
      },
      second: {
        wins: secondWins,
        losses: secondLosses,
        rate: calcRate(secondWins, secondLosses),
      },
      diceWon: {
        wins: diceWonWins,
        losses: diceWonLosses,
        rate: calcRate(diceWonWins, diceWonLosses),
      },
      diceLost: {
        wins: diceLostWins,
        losses: diceLostLosses,
        rate: calcRate(diceLostWins, diceLostLosses),
      },
      opponentList,
    };
  }, [filteredTournaments, selectedLeader]);

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
                  onPress={() => {
                    setSelectedFormat(format);
                    setSelectedLeader("All");
                  }}
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

        {activeTab === "match" && (
          <View style={styles.overviewContainer}>
            <View
              style={{
                marginHorizontal: -spacing.md,
                marginBottom: spacing.md,
              }}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
              >
                {availableLeaders.map((leader) => {
                  const isSelected = leader.id === selectedLeader;

                  if (leader.id === "All") {
                    return (
                      <TouchableOpacity
                        key={leader.id}
                        onPress={() => setSelectedLeader(leader.id)}
                        style={[
                          styles.filterChip,
                          { height: 74, justifyContent: "center" },
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
                          All Leaders
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={leader.id}
                      onPress={() => setSelectedLeader(leader.id)}
                      style={[
                        styles.leaderFilterCard,
                        isSelected
                          ? styles.leaderFilterCardSelected
                          : styles.leaderFilterCardUnselected,
                      ]}
                    >
                      <Image
                        source={{
                          uri: `https://en.onepiece-cardgame.com/images/cardlist/card/${leader.id}.png`,
                        }}
                        style={styles.leaderFilterImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.statRow}>
              <StatBox
                label="TOURNAMENTS"
                value={matchStats.tournamentsCount}
                colors={colors}
                styles={styles}
              />
              <StatBox
                label="MATCHES"
                value={matchStats.totalMatches}
                colors={colors}
                styles={styles}
              />
              <StatBox
                label="1ST PLACE"
                value={matchStats.tournamentWins}
                colors={colors}
                styles={styles}
              />
            </View>
            <View style={styles.statRow}>
              <StatBox
                label="WINS"
                value={matchStats.totalWins}
                colors={colors}
                styles={styles}
              />
              <StatBox
                label="LOSSES"
                value={matchStats.totalLosses}
                colors={colors}
                styles={styles}
              />
              <StatBox
                label="WIN RATE"
                value={`${matchStats.winRate}%`}
                colors={colors}
                styles={styles}
                valueColor={matchStats.winRate >= 50 ? "#10B981" : "#EF4444"}
                containerColor={
                  matchStats.winRate >= 50 ? "#10B981" : "#EF4444"
                }
              />
            </View>

            <View style={styles.statRow}>
              <View
                style={[
                  styles.statBox,
                  { alignItems: "flex-start", padding: spacing.md },
                ]}
              >
                <Text style={styles.sectionTitleSmall}>START POSITION</Text>
                <View style={styles.lineStatRow}>
                  <Text style={styles.lineStatLabel}>1st</Text>
                  <Text
                    style={[
                      styles.lineStatRate,
                      {
                        color:
                          matchStats.first.rate >= 50 ? "#10B981" : "#EF4444",
                      },
                    ]}
                  >
                    {matchStats.first.rate}%
                  </Text>
                  <Text style={styles.lineStatRecord}>
                    {matchStats.first.wins}W - {matchStats.first.losses}L
                  </Text>
                </View>
                <View style={styles.lineStatRow}>
                  <Text style={styles.lineStatLabel}>2nd</Text>
                  <Text
                    style={[
                      styles.lineStatRate,
                      {
                        color:
                          matchStats.second.rate >= 50 ? "#10B981" : "#EF4444",
                      },
                    ]}
                  >
                    {matchStats.second.rate}%
                  </Text>
                  <Text style={styles.lineStatRecord}>
                    {matchStats.second.wins}W - {matchStats.second.losses}L
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statBox,
                  { alignItems: "flex-start", padding: spacing.md },
                ]}
              >
                <Text style={styles.sectionTitleSmall}>DICE ROLL</Text>
                <View style={styles.lineStatRow}>
                  <Text style={styles.lineStatLabel}>Won</Text>
                  <Text
                    style={[
                      styles.lineStatRate,
                      {
                        color:
                          matchStats.diceWon.rate >= 50 ? "#10B981" : "#EF4444",
                      },
                    ]}
                  >
                    {matchStats.diceWon.rate}%
                  </Text>
                  <Text style={styles.lineStatRecord}>
                    {matchStats.diceWon.wins}W - {matchStats.diceWon.losses}L
                  </Text>
                </View>
                <View style={styles.lineStatRow}>
                  <Text style={styles.lineStatLabel}>Lost</Text>
                  <Text
                    style={[
                      styles.lineStatRate,
                      {
                        color:
                          matchStats.diceLost.rate >= 50
                            ? "#10B981"
                            : "#EF4444",
                      },
                    ]}
                  >
                    {matchStats.diceLost.rate}%
                  </Text>
                  <Text style={styles.lineStatRecord}>
                    {matchStats.diceLost.wins}W - {matchStats.diceLost.losses}L
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.topDecksSection}>
              <Text style={styles.sectionTitle}>Opponent Matchups</Text>

              {matchStats.opponentList.map((opp, index) => (
                <View
                  key={`${opp.oppId}-${index}`}
                  style={styles.matchupRowCard}
                >
                  <View style={styles.matchupLeft}>
                    <Image
                      source={{
                        uri: `https://en.onepiece-cardgame.com/images/cardlist/card/${opp.oppId}.png`,
                      }}
                      style={styles.matchupImage}
                      resizeMode="cover"
                    />
                    <View style={styles.matchupInfo}>
                      <Text style={styles.matchupName} numberOfLines={1}>
                        {opp.oppName} ({getSetLabel(opp.oppId)})
                      </Text>
                      <Text style={styles.matchupRecord}>
                        {opp.wins}W - {opp.losses}L
                      </Text>
                    </View>
                  </View>

                  <View style={styles.matchupRates}>
                    <View style={styles.rateCol}>
                      <Text style={styles.rateLabel}>1st</Text>
                      <Text style={styles.rateValue}>{opp.firstRate}%</Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text style={styles.rateLabel}>2nd</Text>
                      <Text style={styles.rateValue}>{opp.secondRate}%</Text>
                    </View>
                    <View style={styles.rateCol}>
                      <Text style={styles.rateLabel}>Overall</Text>
                      <Text
                        style={[
                          styles.rateValue,
                          {
                            color:
                              opp.generalRate >= 50 ? "#10B981" : "#EF4444",
                          },
                        ]}
                      >
                        {opp.generalRate}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const StatBox = ({
  label,
  value,
  colors,
  styles,
  valueColor,
  containerColor,
}: {
  label: string;
  value: string | number;
  colors: ThemeColors;
  styles: any;
  valueColor?: string;
  containerColor?: string;
}) => (
  <View style={styles.statBox}>
    <View style={styles.statValueContainer}>
      <Text
        style={[
          styles.statValue,
          valueColor ? { color: valueColor } : { color: colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
    <View
      style={[
        styles.statLabelContainer,
        containerColor
          ? { backgroundColor: containerColor }
          : { backgroundColor: colors.surfaceAlt },
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  </View>
);

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
    leaderFilterCard: {
      borderRadius: radius.sm,
      overflow: "hidden",
      borderWidth: 2,
    },
    leaderFilterCardSelected: {
      borderColor: colors.primary,
      opacity: 1,
    },
    leaderFilterCardUnselected: {
      borderColor: "transparent",
      opacity: 0.4,
    },
    leaderFilterImage: {
      width: 53,
      height: 74,
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

    // Match colors
    sectionTitleSmall: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: spacing.sm,
    },
    lineStatRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: spacing.xs,
    },
    lineStatLabel: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
      width: 35,
    },
    lineStatRate: {
      fontSize: typography.sizes.md,
      fontWeight: "bold",
      width: 45,
      textAlign: "right",
    },
    lineStatRecord: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      flex: 1,
      textAlign: "right",
    },
    matchupRowCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      alignItems: "center",
      justifyContent: "space-between",
    },
    matchupLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    matchupImage: {
      width: 40,
      height: 56,
      borderRadius: radius.sm,
      marginRight: spacing.sm,
    },
    matchupInfo: {
      flex: 1,
      paddingRight: spacing.sm,
    },
    matchupName: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    matchupRecord: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      marginTop: 2,
    },
    matchupRates: {
      flexDirection: "row",
      gap: spacing.md,
    },
    rateCol: {
      alignItems: "center",
    },
    rateLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    rateValue: {
      color: colors.text,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
  });
