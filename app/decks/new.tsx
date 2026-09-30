import {
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../contexts/SettingsContext";
import { createDeck } from "../../repositories/decks";
import { type MasterCardRow } from "../../repositories/cards";
import LeaderPicker from "../../components/LeaderPicker";
import { resolveCardImage } from "../../utils/cards";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";

export default function NewDeck() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState("");
  const [leader, setLeader] = useState<MasterCardRow | null>(null);
  const [leaderPickerVisible, setLeaderPickerVisible] = useState(false);

  const handleCreate = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert("Name required", "Give your deck a name first.");
      return;
    }

    const id = createDeck({ name: trimmedName, leaderId: leader?.id });
    router.replace(`/decks/${id}`);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Red Zoro Aggro"
          placeholderTextColor={colors.placeholder}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.label}>Leader</Text>
        <TouchableOpacity
          style={styles.selectorRow}
          onPress={() => setLeaderPickerVisible(true)}
        >
          {leader ? (
            <>
              <Image
                source={{ uri: resolveCardImage(leader.id, leader.image_url) }}
                placeholder={require("../../assets/images/leader-card-back.png")}
                transition={200}
                style={styles.leaderThumb}
                contentFit="contain"
                cachePolicy="memory-disk"
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

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createButtonText}>Create Deck</Text>
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
    leaderThumb: { width: 40, height: 56, borderRadius: radius.sm },
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
