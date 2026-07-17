import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../_layout";
import { createTournament } from "../../repositories/tournaments";
import { type MasterCardRow } from "../../repositories/cards";
import LeaderPicker from "../../components/LeaderPicker";
import { radius, spacing, typography, type ThemeColors } from "../../constants/theme";

export default function NewTournament() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [placement, setPlacement] = useState("");
  const [leader, setLeader] = useState<MasterCardRow | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      Alert.alert("Title required", "Give your tournament a name first.");
      return;
    }

    const parsedPlacement = placement.trim()
      ? parseInt(placement.trim(), 10)
      : null;

    const id = createTournament({
      title: trimmedTitle,
      description: description.trim() || null,
      leaderId: leader?.id ?? null,
      placement:
        parsedPlacement !== null && !Number.isNaN(parsedPlacement)
          ? parsedPlacement
          : null,
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

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Format, venue, notes..."
          placeholderTextColor={colors.placeholder}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Leader</Text>
        <TouchableOpacity
          style={styles.leaderSelector}
          onPress={() => setPickerVisible(true)}
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
              <Text style={styles.leaderName}>{leader.name}</Text>
            </>
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
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

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create Tournament</Text>
        </TouchableOpacity>
      </ScrollView>

      <LeaderPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(selected) => {
          setLeader(selected);
          setPickerVisible(false);
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
    multilineInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    leaderSelector: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    leaderThumb: {
      width: 40,
      height: 56,
      borderRadius: radius.sm,
    },
    leaderName: {
      color: colors.text,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    leaderPlaceholder: {
      color: colors.textMuted,
      fontSize: typography.sizes.md,
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
