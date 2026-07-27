import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useSettings } from "../_layout";
import { createTournament } from "../../repositories/tournaments";
import { type MasterCardRow } from "../../repositories/cards";
import LeaderPicker from "../../components/LeaderPicker";
import FormatPicker from "../../components/FormatPicker";
import { toDateString, formatDateDisplay } from "../../utils/date";
import { parsePlacementInput } from "../../utils/placement";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";

export default function NewTournament() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [format, setFormat] = useState("");
  const [placement, setPlacement] = useState("");
  const [leader, setLeader] = useState<MasterCardRow | null>(null);

  const [leaderPickerVisible, setLeaderPickerVisible] = useState(false);
  const [formatPickerVisible, setFormatPickerVisible] = useState(false);

  const [eventDate, setEventDate] = useState(() => new Date());
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const handleDateChange = (
    _event: DateTimePickerChangeEvent,
    selected: Date,
  ) => {
    setDatePickerVisible(Platform.OS === "ios");
    setEventDate(selected);
  };

  const handleDateDismiss = () => setDatePickerVisible(false);

  const handleCreate = () => {
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

    const id = createTournament({
      title: trimmedTitle,
      format: trimmedFormat,
      leaderId: leader?.id ?? null,
      placement: parsedPlacement.value,
      eventDate: toDateString(eventDate),
    });

    router.replace(`/tournaments/${id}`);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
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
          <Text style={styles.selectorText}>
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
                source={{
                  uri: `https://en.onepiece-cardgame.com/images/cardlist/card/${leader.id}.png`,
                }}
                style={styles.leaderThumb}
                resizeMode="contain"
              />
              <Text style={styles.selectorText}>{leader.name}</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="add-circle-outline"
                size={24}
                color={colors.accent}
              />
              <Text style={styles.placeholderText}>Choose your leader</Text>
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

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create Tournament</Text>
        </TouchableOpacity>
      </ScrollView>

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
    </>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    label: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: spacing.xs,
      marginTop: spacing.md,
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
    leaderThumb: {
      width: 40,
      height: 56,
      borderRadius: radius.sm,
    },
    createButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
      marginTop: spacing.xl,
    },
    createButtonText: {
      color: "#fff",
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
  });
