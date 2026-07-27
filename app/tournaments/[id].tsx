import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  Platform,
  ScrollView,
} from "react-native";
import {
  router,
  Stack,
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useSettings } from "../_layout";
import {
  getTournamentById,
  getMatchesForTournament,
  addMatch,
  updateMatch,
  deleteMatch,
  updateTournamentPlacement,
  updateTournament,
  deleteTournament,
} from "../../repositories/tournaments";
import { getCardById, type MasterCardRow } from "../../repositories/cards";
import type { MatchResult, MatchRow, TournamentRow } from "../../database";
import LeaderPicker from "../../components/LeaderPicker";
import FormatPicker from "../../components/FormatPicker";
import {
  toDateString,
  fromDateString,
  formatDateDisplay,
} from "../../utils/date";
import { parsePlacementInput } from "../../utils/placement";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";

const COLOR_HEX: Record<string, string> = {
  Red: "#ef4444",
  Green: "#22c55e",
  Blue: "#3b82f6",
  Purple: "#a855f7",
  Black: "#3f3f46",
  Yellow: "#eab308",
};

const getColorHex = (color: string | null | undefined, fallback: string) => {
  if (!color) return fallback;
  const first = color.split("/")[0]?.trim();
  return COLOR_HEX[first] ?? fallback;
};

const getSetLabel = (cardId: string) => cardId.split("-")[0] ?? "";

const getOrdinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

const cardImageUrl = (cardId: string) =>
  `https://en.onepiece-cardgame.com/images/cardlist/card/${cardId}.png`;

type EnrichedMatch = MatchRow & { opponent: MasterCardRow | null };

export default function TournamentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = Number(id);
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const [tournament, setTournament] = useState<TournamentRow | null>(null);
  const [leaderCard, setLeaderCard] = useState<MasterCardRow | null>(null);
  const [matches, setMatches] = useState<EnrichedMatch[]>([]);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [editingMatch, setEditingMatch] = useState<EnrichedMatch | null>(null);
  const [placementModalVisible, setPlacementModalVisible] = useState(false);
  const [editTournamentVisible, setEditTournamentVisible] = useState(false);

  const loadData = useCallback(() => {
    const t = getTournamentById(tournamentId);
    setTournament(t);
    setLeaderCard(t?.leader_id ? getCardById(t.leader_id) : null);

    const rawMatches = getMatchesForTournament(tournamentId);
    setMatches(
      rawMatches.map((m) => ({
        ...m,
        opponent: m.opponent_leader_id
          ? getCardById(m.opponent_leader_id)
          : null,
      })),
    );
  }, [tournamentId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Tournament not found.</Text>
      </View>
    );
  }

  const wins = matches.filter(
    (m) => m.result === "W" || m.result === "BYE",
  ).length;
  const losses = matches.filter((m) => m.result === "L").length;

  const leaderColorHex = getColorHex(leaderCard?.color, colors.primary);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: tournament.title,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setEditTournamentVisible(true)}
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

      <View style={styles.summaryBox}>
        {leaderCard ? (
          <View
            style={[styles.leaderImageWrap, { borderColor: leaderColorHex }]}
          >
            <Image
              source={{ uri: cardImageUrl(leaderCard.id) }}
              style={styles.leaderImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={[styles.leaderImageWrap, styles.leaderImagePlaceholder]}>
            <Ionicons name="help-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.summaryMiddle}>
          {leaderCard && (
            <Text style={styles.leaderLabel} numberOfLines={1}>
              {leaderCard.name} ({getSetLabel(leaderCard.id)})
            </Text>
          )}
          <View style={styles.recordRow}>
            <Text style={styles.recordBig}>
              {wins} - {losses}
            </Text>
            <TouchableOpacity
              style={styles.placementChip}
              onPress={() => setPlacementModalVisible(true)}
            >
              <Text style={styles.placementChipText}>
                {tournament.placement != null
                  ? getOrdinal(tournament.placement)
                  : "+ Place"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryRight}>
          <Text style={styles.tournamentDate}>
            {formatDateDisplay(tournament.event_date)}
          </Text>
          <View style={styles.formatChip}>
            <Text style={styles.formatChipText}>{tournament.format}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        style={styles.flatList}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.matchRow}
            onPress={() => {
              setEditingMatch(item);
              setMatchModalVisible(true);
            }}
          >
            <Text style={styles.matchIndex}>{index + 1}</Text>

            {item.result === "BYE" ? (
              <View
                style={[styles.opponentThumb, styles.opponentThumbPlaceholder]}
              >
                <Ionicons
                  name="remove-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </View>
            ) : item.opponent ? (
              <Image
                source={{ uri: cardImageUrl(item.opponent.id) }}
                style={styles.opponentThumb}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[styles.opponentThumb, styles.opponentThumbPlaceholder]}
              >
                <Ionicons
                  name="help-outline"
                  size={18}
                  color={colors.textMuted}
                />
              </View>
            )}

            <View style={styles.matchInfo}>
              <Text style={styles.opponentName} numberOfLines={1}>
                {item.result === "BYE"
                  ? "BYE"
                  : item.opponent
                    ? `${item.opponent.name} (${getSetLabel(item.opponent.id)})`
                    : "Unknown leader"}
              </Text>
              {item.comment && (
                <Text style={styles.matchComment} numberOfLines={2}>
                  {item.comment}
                </Text>
              )}
            </View>

            {item.dice_roll != null && (
              <View
                style={[
                  styles.turnBadge,
                  item.dice_roll
                    ? styles.resultBadgeWin
                    : styles.resultBadgeLoss,
                ]}
              >
                <Ionicons
                  name="dice"
                  size={14}
                  color={item.dice_roll ? COLOR_HEX.Green : COLOR_HEX.Red}
                />
              </View>
            )}

            {item.went_first != null && (
              <View style={styles.turnBadge}>
                <Text style={styles.turnBadgeText}>
                  {item.went_first ? "1st" : "2nd"}
                </Text>
              </View>
            )}

            <View
              style={[
                styles.resultBadge,
                item.result === "L"
                  ? styles.resultBadgeLoss
                  : styles.resultBadgeWin,
              ]}
            >
              <Text style={styles.resultBadgeText}>{item.result}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons
              name="game-controller-outline"
              size={40}
              color={colors.textMuted}
            />
            <Text style={styles.emptyText}>
              No matches logged yet. Add your first round below.
            </Text>
          </View>
        }
      />

      <View
        style={[styles.footer, { paddingBottom: spacing.md + insets.bottom }]}
      >
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingMatch(null);
            setMatchModalVisible(true);
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Add New Match</Text>
        </TouchableOpacity>
      </View>

      <MatchModal
        key={
          matchModalVisible
            ? editingMatch
              ? `match-edit-${editingMatch.id}`
              : "match-add"
            : "match-closed"
        }
        visible={matchModalVisible}
        existingMatch={editingMatch}
        onClose={() => setMatchModalVisible(false)}
        onSaved={() => {
          setMatchModalVisible(false);
          loadData();
        }}
        onDeleted={() => {
          setMatchModalVisible(false);
          loadData();
        }}
        tournamentId={tournamentId}
      />

      <PlacementModal
        key={placementModalVisible ? "placement-open" : "placement-closed"}
        visible={placementModalVisible}
        initialValue={tournament.placement}
        onClose={() => setPlacementModalVisible(false)}
        onSave={(placement) => {
          updateTournamentPlacement(tournamentId, placement);
          setPlacementModalVisible(false);
          loadData();
        }}
      />

      <EditTournamentModal
        key={editTournamentVisible ? "edit-open" : "edit-closed"}
        visible={editTournamentVisible}
        tournament={tournament}
        onClose={() => setEditTournamentVisible(false)}
        onSaved={() => {
          setEditTournamentVisible(false);
          loadData();
        }}
        onDeleted={() => {
          setEditTournamentVisible(false);
          router.replace("/tournaments");
        }}
      />
    </View>
  );
}

type PlacementModalProps = {
  visible: boolean;
  initialValue: number | null;
  onClose: () => void;
  onSave: (placement: number | null) => void;
};

function PlacementModal({
  visible,
  initialValue,
  onClose,
  onSave,
}: PlacementModalProps) {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [value, setValue] = useState(
    initialValue != null ? String(initialValue) : "",
  );

  const handleSave = () => {
    const parsed = parsePlacementInput(value);
    if (!parsed.ok) {
      Alert.alert(
        "Invalid placement",
        "Placement must be a positive number (1, 2, 3...).",
      );
      return;
    }
    onSave(parsed.value);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.placementOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.placementModalContent}>
          <Text style={styles.label}>Placement</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1 for 1st place"
            placeholderTextColor={colors.placeholder}
            value={value}
            onChangeText={setValue}
            keyboardType="number-pad"
            autoFocus
          />
          <View style={styles.placementActionsRow}>
            <TouchableOpacity
              style={styles.placementClearButton}
              onPress={() => onSave(null)}
            >
              <Text style={styles.placementClearButtonText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, styles.placementSaveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type EditTournamentModalProps = {
  visible: boolean;
  tournament: TournamentRow;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

function EditTournamentModal({
  visible,
  tournament,
  onClose,
  onSaved,
  onDeleted,
}: EditTournamentModalProps) {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState(tournament.title);
  const [format, setFormat] = useState(tournament.format ?? "");
  const [placement, setPlacement] = useState(
    tournament.placement != null ? String(tournament.placement) : "",
  );
  const [leader, setLeader] = useState<MasterCardRow | null>(
    tournament.leader_id ? getCardById(tournament.leader_id) : null,
  );
  const [eventDate, setEventDate] = useState(() =>
    fromDateString(tournament.event_date),
  );
  const [leaderPickerVisible, setLeaderPickerVisible] = useState(false);
  const [formatPickerVisible, setFormatPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleDateChange = (
    _event: DateTimePickerChangeEvent,
    selected: Date,
  ) => {
    setDatePickerVisible(Platform.OS === "ios");
    setEventDate(selected);
  };

  const handleDateDismiss = () => setDatePickerVisible(false);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Title required", "Give your tournament a name first.");
      return;
    }

    const trimmedFormat = format.trim();
    if (!trimmedFormat) {
      Alert.alert(
        "Format required",
        "Please select a format for this tournament.",
      );
      return;
    }

    const parsedPlacement = parsePlacementInput(placement);
    if (!parsedPlacement.ok) {
      Alert.alert(
        "Invalid placement",
        "Placement must be a positive number (1, 2, 3...).",
      );
      return;
    }

    updateTournament(tournament.id, {
      title: trimmedTitle,
      format: trimmedFormat,
      leaderId: leader?.id ?? null,
      placement: parsedPlacement.value,
      eventDate: toDateString(eventDate),
    });
    onSaved();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete tournament?",
      "This will also delete all its logged matches. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTournament(tournament.id);
            onDeleted();
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Tournament</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Regional Qualifier"
            placeholderTextColor={colors.placeholder}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={styles.selectorRow}
            onPress={() => setDatePickerVisible(true)}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.accent} />
            <Text style={styles.leaderName}>
              {formatDateDisplay(toDateString(eventDate))}
            </Text>
          </TouchableOpacity>
          {datePickerVisible && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              maximumDate={new Date()}
              display={Platform.OS === "ios" ? "inline" : "default"}
              onValueChange={handleDateChange}
              onDismiss={handleDateDismiss}
            />
          )}

          <Text style={styles.label}>Format</Text>
          <TouchableOpacity
            style={styles.selectorRow}
            onPress={() => setFormatPickerVisible(true)}
          >
            <Text style={format ? styles.selectorText : styles.placeholderText}>
              {format || "e.g. OP16, EB04, Legacy..."}
            </Text>
            <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <Text style={styles.label}>Leader</Text>
          <TouchableOpacity
            style={styles.selectorRow}
            onPress={() => setLeaderPickerVisible(true)}
          >
            {leader ? (
              <>
                <Image
                  source={{ uri: cardImageUrl(leader.id) }}
                  style={styles.leaderThumbSmall}
                  resizeMode="cover"
                />
                <Text style={styles.placeholderText}>{leader.name}</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={colors.accent}
                />
                <Text style={styles.leaderPlaceholder}>Choose your leader</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Placement (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2 for 2nd place"
            placeholderTextColor={colors.placeholder}
            value={placement}
            onChangeText={setPlacement}
            keyboardType="number-pad"
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.deleteButtonText}>Delete Tournament</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <LeaderPicker
        visible={leaderPickerVisible}
        onClose={() => setLeaderPickerVisible(false)}
        onSelect={(selected) => {
          setLeader(selected);
          setLeaderPickerVisible(false);
        }}
      />

      <FormatPicker
        visible={formatPickerVisible}
        onClose={() => setFormatPickerVisible(false)}
        onSelect={(selectedFormat) => {
          setFormat(selectedFormat);
          setFormatPickerVisible(false);
        }}
      />
    </Modal>
  );
}

type MatchModalProps = {
  visible: boolean;
  existingMatch: EnrichedMatch | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  tournamentId: number;
};

function MatchModal({
  visible,
  existingMatch,
  onClose,
  onSaved,
  onDeleted,
  tournamentId,
}: MatchModalProps) {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = existingMatch != null;

  const [opponent, setOpponent] = useState<MasterCardRow | null>(
    existingMatch?.opponent ?? null,
  );
  const [result, setResult] = useState<MatchResult>(
    existingMatch?.result ?? "W",
  );
  const [diceRoll, setDiceRoll] = useState(existingMatch?.dice_roll !== 0);
  const [wentFirst, setWentFirst] = useState(existingMatch?.went_first !== 0);
  const [comment, setComment] = useState(existingMatch?.comment ?? "");
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSave = () => {
    if (result !== "BYE" && !opponent) {
      Alert.alert("Opponent required", "Choose the opponent's leader first.");
      return;
    }

    const payload = {
      opponentLeaderId: result === "BYE" ? null : (opponent?.id ?? null),
      result,
      diceRoll: result === "BYE" ? null : diceRoll,
      wentFirst: result === "BYE" ? null : wentFirst,
      comment: comment.trim() || null,
    };

    if (isEditing) {
      updateMatch(existingMatch.id, payload);
    } else {
      addMatch({ tournamentId, ...payload });
    }
    onSaved();
  };

  const handleDelete = () => {
    if (!existingMatch) return;
    Alert.alert("Delete match?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMatch(existingMatch.id);
          onDeleted();
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {isEditing ? "Edit Match" : "Add Match"}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.label}>Result</Text>
          <View style={styles.resultOptionsRow}>
            {(["W", "L", "BYE"] as MatchResult[]).map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.resultOption,
                  result === option && styles.resultOptionActive,
                ]}
                onPress={() => setResult(option)}
              >
                <Text
                  style={[
                    styles.resultOptionText,
                    result === option && styles.resultOptionTextActive,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {result !== "BYE" && (
            <>
              <Text style={styles.label}>Opponent Leader</Text>
              <TouchableOpacity
                style={styles.selectorRow}
                onPress={() => setPickerVisible(true)}
              >
                {opponent ? (
                  <>
                    <Image
                      source={{ uri: cardImageUrl(opponent.id) }}
                      style={styles.leaderThumbSmall}
                      resizeMode="contain"
                    />
                    <Text style={styles.leaderName}>{opponent.name}</Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="add-circle-outline"
                      size={22}
                      color={colors.accent}
                    />
                    <Text style={styles.leaderPlaceholder}>
                      Choose opponent leader
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.label}>Dice Roll</Text>
              <View style={styles.resultOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.resultOption,
                    diceRoll && styles.resultOptionActive,
                  ]}
                  onPress={() => setDiceRoll(true)}
                >
                  <Text
                    style={[
                      styles.resultOptionText,
                      diceRoll && styles.resultOptionTextActive,
                    ]}
                  >
                    Won Dice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.resultOption,
                    !diceRoll && styles.resultOptionActive,
                  ]}
                  onPress={() => setDiceRoll(false)}
                >
                  <Text
                    style={[
                      styles.resultOptionText,
                      !diceRoll && styles.resultOptionTextActive,
                    ]}
                  >
                    Lost Dice
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Turn Order</Text>
              <View style={styles.resultOptionsRow}>
                <TouchableOpacity
                  style={[
                    styles.resultOption,
                    wentFirst && styles.resultOptionActive,
                  ]}
                  onPress={() => setWentFirst(true)}
                >
                  <Text
                    style={[
                      styles.resultOptionText,
                      wentFirst && styles.resultOptionTextActive,
                    ]}
                  >
                    Went 1st
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.resultOption,
                    !wentFirst && styles.resultOptionActive,
                  ]}
                  onPress={() => setWentFirst(false)}
                >
                  <Text
                    style={[
                      styles.resultOptionText,
                      !wentFirst && styles.resultOptionTextActive,
                    ]}
                  >
                    Went 2nd
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.label}>Comment</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            placeholder="Notes on leader matchup, key plays..."
            placeholderTextColor={colors.placeholder}
            value={comment}
            onChangeText={setComment}
            multiline
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {isEditing ? "Save Changes" : "Save Match"}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete Match</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <LeaderPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(selected) => {
          setOpponent(selected);
          setPickerVisible(false);
        }}
      />
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    headerIcon: { paddingRight: spacing.sm },
    flatList: { flex: 1 },
    summaryBox: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      margin: spacing.md,
      padding: spacing.md,
      gap: spacing.md,
    },
    leaderImageWrap: {
      width: 64,
      aspectRatio: 0.7,
      borderRadius: radius.md,
      borderWidth: 2,
      overflow: "hidden",
    },
    leaderImagePlaceholder: {
      backgroundColor: colors.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
      borderColor: colors.border,
    },
    leaderImage: { width: "100%", height: "100%" },
    summaryMiddle: { justifyContent: "center" },
    leaderLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
      marginBottom: 2,
    },
    recordRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    recordBig: {
      color: colors.text,
      fontSize: typography.sizes.display,
      fontWeight: "bold",
    },
    placementChip: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    placementChipText: {
      color: colors.warning,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
    },
    summaryRight: { flex: 1, alignItems: "flex-end", justifyContent: "center" },
    tournamentDate: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
      textAlign: "right",
    },
    formatChip: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      marginTop: spacing.xs,
    },
    formatChipText: {
      color: colors.text,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
    },
    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
    matchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    matchIndex: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      width: 16,
      textAlign: "center",
    },
    opponentThumb: {
      width: 36,
      height: 50,
      borderRadius: radius.sm,
    },
    opponentThumbPlaceholder: {
      backgroundColor: colors.surfaceAlt,
      justifyContent: "center",
      alignItems: "center",
    },
    matchInfo: { flex: 1 },
    opponentName: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    matchComment: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      marginTop: 2,
    },
    turnBadge: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 4,
    },
    turnBadgeText: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
    },
    resultBadge: {
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      minWidth: 36,
      alignItems: "center",
    },
    resultBadgeWin: { backgroundColor: "rgba(74, 222, 128, 0.15)" },
    resultBadgeLoss: { backgroundColor: colors.dangerBg },
    resultBadgeText: {
      color: colors.text,
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
    // Add-match modal styles
    modalContainer: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
    },
    closeButton: { padding: spacing.xs },
    modalContent: { padding: spacing.lg },
    label: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    resultOptionsRow: { flexDirection: "row", gap: spacing.sm },
    resultOption: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      alignItems: "center",
    },
    resultOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    resultOptionText: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    resultOptionTextActive: { color: "#fff" },
    selectorRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    selectorText: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    placeholderText: {
      flex: 1,
      color: colors.textMuted,
      fontSize: typography.sizes.md,
    },
    leaderThumbSmall: { width: 32, height: 45, borderRadius: radius.sm },
    leaderName: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    leaderPlaceholder: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: typography.sizes.md,
    },
    multilineInput: { minHeight: 80, textAlignVertical: "top" },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      marginTop: spacing.xl,
    },
    saveButtonText: {
      color: "#fff",
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    deleteButton: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    deleteButtonText: {
      color: colors.danger,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    // Placement modal styles
    placementOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    placementModalContent: {
      width: "80%",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    placementActionsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    placementClearButton: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    placementClearButtonText: {
      color: colors.textMuted,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    placementSaveButton: { flex: 1, marginTop: 0 },
  });
